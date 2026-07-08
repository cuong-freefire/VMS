import { signAccessToken } from "../utils/jwt.util.js";
import { ServiceError } from "../utils/response.util.js";
import bcrypt from "bcryptjs";
import { generateOTP, hashOTP, verifyOTP as verifyOTPHash } from "../utils/otp.util.js";
import { generateOTPEmailContent } from "../utils/email.util.js";
import authRepository from "../repositories/auth.repository.js";
import logger from "../config/logger.config.js";
import { transporter } from "../config/transporter.config.js";

/**
 * Login service - Authenticate user with email and password
 * Implements UC03: User Story 1 - Đăng nhập thành công với tài khoản hợp lệ
 * 
 * Business Logic Flow:
 * 1. Check account lockout (5 failed attempts in 15 minutes)
 * 2. Find user by email (case-insensitive)
 * 3. Verify password using bcrypt.compare()
 * 4. Check if account is active (soft delete)
 * 5. Check if email is verified
 * 6. Generate JWT with jti (Session ID)
 * 7. Upsert session to enforce Single Active Session
 * 8. Reset login attempts counter
 * 9. Return user data (without password_hash)
 * 
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Object with token and user data
 * @throws {ServiceError} 401/403/429 errors
 */
async function loginService(email, password) {
    // 1. Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check lockout status first
    const loginAttempt = await authRepository.getLoginAttempts(normalizedEmail);
    if (loginAttempt && loginAttempt.lockedUntil) {
        const now = new Date();
        if (loginAttempt.lockedUntil > now) {
            throw new ServiceError(
                "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
                429,
                "ACCOUNT_LOCKED",
                { locked_until: loginAttempt.lockedUntil }
            );
        }
    }

    // 3. Find user by email
    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        // Increment attempts for non-existent email
        await authRepository.incrementLoginAttempts(normalizedEmail);
        throw new ServiceError(
            "Email hoặc mật khẩu không đúng",
            401,
            "UNAUTHORIZED"
        );
    }


    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        // Increment attempts for wrong password
        await authRepository.incrementLoginAttempts(normalizedEmail);
        throw new ServiceError(
            "Email hoặc mật khẩu không đúng",
            401,
            "UNAUTHORIZED"
        );
    }

    // 5. Check if account is active (soft delete)
    if (!user.isActive) {
        throw new ServiceError(
            "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
            403,
            "ACCOUNT_DISABLED"
        );
    }

    // 6. Check if email is verified
    if (!user.emailVerified) {
        throw new ServiceError(
            "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản.",
            403,
            "EMAIL_NOT_VERIFIED"
        );
    }

    // 7. Generate JWT token with jti (Session ID)
    const jti = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = signAccessToken({
        user_id: user.id,
        email: user.email,
        role_id: user.roleId,
        jti
    });

    // 8. Upsert session (Single Active Session enforcement)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authRepository.upsertSession(user.id, jti, expiresAt);

    // 9. Reset login attempts
    await authRepository.resetLoginAttempts(normalizedEmail);

    // 10. Return user data (without password_hash)
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.fullName,
            role_id: user.roleId,
            avatar_url: user.avatarUrl,
            phone: user.phone,
            created_at: user.createdAt ? user.createdAt.toISOString() : null,
        }
    };
}

/**
 * Send OTP to email for registration
 * Implements: User Story 1 - Gửi OTP để xác thực email
 * 
 * Business Logic:
 * - Check if email already exists in users table
 * - Check cooldown (60 seconds between resends)
 * - Check lockout (15 minutes after 5 failed attempts)
 * - Generate 6-digit OTP and hash it
 * - Store in email_verifications table
 * - Send email via NodeMailer
 * 
 * @param {string} email - User email (normalized)
 * @returns {Promise<Object>} Success response with cooldown info
 * @throws {ServiceError} 400/409/429/503 errors
 */
const sendOTP = async (email) => {
    // 1. Validate email format (already done by Zod middleware)
    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if email exists in users table
    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser && existingUser.isActive) {
        throw new ServiceError(
            "Email đã được sử dụng. Vui lòng sử dụng email khác.",
            409,
            "EMAIL_ALREADY_EXISTS"
        );
    }

    // 4. Check existing verification record
    let verification = await authRepository.findVerificationByEmailAndType(normalizedEmail, "REGISTER");

    // 5. Check cooldown: (NOW - last_sent_at) < 60 seconds
    if (verification && verification.lastSentAt) {
        const now = new Date();
        const timeSinceLastSend = Math.floor((now - verification.lastSentAt) / 1000); // seconds
        if (timeSinceLastSend < 60) {
            const remainingSeconds = 60 - timeSinceLastSend; // Thời gian phải chờ trước khi gửi lại OTP
            throw new ServiceError(
                `Vui lòng đợi ${remainingSeconds} giây trước khi gửi lại OTP`,
                429,
                "COOLDOWN_ACTIVE"
            );
        }
    }

    // 6. Check lockout: is_locked=TRUE AND locked_until > NOW
    if (verification && verification.isLocked && verification.lockedUntil) {
        const now = new Date();
        if (verification.lockedUntil > now) {
            const remainingMinutes = Math.ceil((verification.lockedUntil - now) / (1000 * 60));
            throw new ServiceError(
                `Email đã bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
                429,
                "EMAIL_LOCKED"
            );
        }
    }

    // 7. Generate 6-digit OTP
    const otp = generateOTP();

    // 8. Hash OTP with bcryptjs (10 rounds)
    const otpHash = await hashOTP(otp);

    // 9. Upsert email_verifications record
    if (verification) {
        // Update existing record
        await authRepository.updateVerification(normalizedEmail, {
            otpHash,
            lastSentAt: new Date(),
            attempts: 0,
            isLocked: false,
            lockedUntil: null,
        });
    } else {
        // Create new record
        await authRepository.createVerification(normalizedEmail, otpHash, "REGISTER");
    }

    // 10. Send email via NodeMailer (placeholder - requires email service integration)
    // TODO: Integrate with NodeMailer email service to send OTP email
    const { subject, plainText } = generateOTPEmailContent(otp, 10);
    // console.log(`📧 Email to ${normalizedEmail}:\nSubject: ${subject}\n${plainText}`);
    transporter.sendMail({
        from: process.env.SMTP_USER,
        to: normalizedEmail,
        subject,
        text: plainText,
    }).catch((err) => {
        console.error("Error sending OTP email:", err);
        throw new ServiceError(
            "Dịch vụ email không khả dụng. Vui lòng thử lại sau.",
            503,
            "EMAIL_SERVICE_UNAVAILABLE"
        );
    });

    // 11. Return success response
    return {
        success: true,
        message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
        cooldown_seconds: 60,
    };
};

/**
 * Verify OTP and create user account
 * Implements: User Story 2 - Xác thực OTP và tạo tài khoản thành công
 * 
 * Business Logic:
 * - Validate all input fields with Zod
 * - Find verification record
 * - Check lockout status
 * - Check OTP expiration (10 minutes)
 * - Verify OTP with bcrypt.compare
 * - Hash password with bcryptjs (12 rounds)
 * - Create user in transaction
 * - Delete verification record
 * 
 * @param {Object} payload - Verification payload
 * @param {string} payload.email - User email
 * @param {string} payload.otp - 6-digit OTP
 * @param {string} payload.fullName - Full name
 * @param {string} payload.phoneNumber - Phone number
 * @param {string} payload.password - Password
 * @returns {Promise<Object>} Success response with user_id
 * @throws {ServiceError} 400/429/500 errors
 */
const verifyOTP = async (payload) => {
    const { email, otp, fullName, phoneNumber, password } = payload;

    // 1. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find verification record
    const verification = await authRepository.findVerificationByEmailAndType(normalizedEmail, "REGISTER");
    if (!verification) {
        throw new ServiceError(
            "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại OTP mới.",
            400,
            "VERIFICATION_NOT_FOUND"
        );
    }

    // 3. Check if locked
    if (verification.isLocked && verification.lockedUntil) {
        const now = new Date();
        if (verification.lockedUntil > now) {
            const remainingMinutes = Math.ceil((verification.lockedUntil - now) / (1000 * 60));
            throw new ServiceError(
                `Email đã bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
                429,
                "EMAIL_LOCKED"
            );
        }
    }

    // 4. Check OTP expiration: (NOW - lastSendAt) > 10 minutes
    const now = new Date();
    const otpAgeMinutes = (now - verification.lastSendAt) / (1000 * 60);
    if (otpAgeMinutes > 10) {
        throw new ServiceError(
            "Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.",
            400,
            "OTP_EXPIRED"
        );
    }

    // 5. Verify OTP with bcrypt.compare
    const isValidOTP = await verifyOTPHash(otp, verification.otpHash);
    if (!isValidOTP) {
        // Increment attempts
        const newAttempts = verification.attempts + 1;
        const updateData = { attempts: newAttempts };

        // Check if should lock (5+ failed attempts)
        if (newAttempts >= 5) {
            updateData.isLocked = true;
            updateData.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
        }

        await authRepository.updateVerification(normalizedEmail, updateData);

        if (newAttempts >= 5) {
            throw new ServiceError(
                "Email đã bị khóa sau 5 lần nhập sai. Vui lòng thử lại sau 15 phút.",
                429,
                "EMAIL_LOCKED"
            );
        }

        throw new ServiceError(
            `Mã OTP không chính xác. ${5 - newAttempts} lần thử còn lại.`,
            400,
            "INVALID_OTP"
        );
    }

    // 6. Hash password with bcryptjs (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // 7. Get Volunteer role
    const volunteerRole = await authRepository.getVolunteerRole();
    if (!volunteerRole) {
        throw new ServiceError(
            "Vai trò Volunteer không tồn tại trong hệ thống.",
            500,
            "ROLE_NOT_FOUND"
        );
    }

    // 8. Create user (in transaction-like manner with delete)
    const newUser = await authRepository.createUser({
        email: normalizedEmail,
        passwordHash,
        fullName,
        phone: phoneNumber,
        roleId: volunteerRole.id,
    });

    // 9. Delete verification record
    await authRepository.deleteVerification(normalizedEmail, "REGISTER");

    // 10. Return success response
    return {
        success: true,
        message: "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
        userId: newUser.id,
    };
};


/**
 * Request password reset OTP
 * Implements UC07: US1 (Forgot Password) + US4 (Zero User Enumeration)
 *
 * @param {string} email
 * @returns {Promise<Object>}
 * @throws {ServiceError} 429
 */
const requestResetPassword = async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await authRepository.findUserByEmail(normalizedEmail);

    // Zero enumeration: non-existing email → fake OTP, same response
    if (!user) {
        generateOTP(); // Discard fake OTP
        return {
            success: true,
            message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư.",
            cooldown_seconds: 60,
        };
    }

    const verification = await authRepository.findVerificationByEmailAndType(
        normalizedEmail, "RESET_PASSWORD"
    );

    // FR-007: Check lockout BEFORE cooldown
    if (verification && verification.isLocked && verification.lockedUntil) {
        const now = new Date();
        if (verification.lockedUntil > now) {
            const remainingSeconds = Math.ceil((verification.lockedUntil - now) / 1000);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            throw new ServiceError(
                `Tài khoản bị khóa ${minutes} phút ${seconds} giây do nhập sai OTP quá nhiều. Vui lòng thử lại sau.`,
                429, "EMAIL_LOCKED", { lock_remaining_seconds: remainingSeconds }
            );
        }
    }

    // Cooldown: lastSentAt + 60s > NOW
    if (verification && verification.lastSentAt) {
        const now = new Date();
        const elapsed = Math.floor((now - verification.lastSentAt) / 1000);
        if (elapsed < 60) {
            const remaining = 60 - elapsed;
            throw new ServiceError(
                `Vui lòng đợi ${remaining} giây trước khi gửi lại OTP`,
                429, "COOLDOWN_ACTIVE", { remaining_seconds: remaining }
            );
        }
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    if (verification) {
        await authRepository.updateVerification(normalizedEmail, {
            otpHash, createdAt: new Date(), lastSentAt: new Date(),
            attempts: 0, isLocked: false, lockedUntil: null,
        }, "RESET_PASSWORD");
    } else {
        await authRepository.createVerification(normalizedEmail, otpHash, "RESET_PASSWORD");
    }

    // Send email async — silent failure, no throw
    transporter.sendMail({
        from: process.env.SMTP_USER,
        to: normalizedEmail,
        subject: "Mã OTP đặt lại mật khẩu - VMS",
        text: `Mã OTP đặt lại mật khẩu của bạn là: ${otp}

Mã có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.

---
Email tự động từ hệ thống VMS. Vui lòng không trả lời email này.`,
    }).catch(() => { });

    return {
        success: true,
        message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư.",
        cooldown_seconds: 60,
    };
};

/**
 * Verify OTP for password reset
 * Implements UC07: US1 + US2 (Lockout after 5 wrong attempts)
 *
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Object>} { verified: true }
 * @throws {ServiceError} 400/404/429
 */
const verifyResetOTP = async (email, otp) => {
    const normalizedEmail = email.toLowerCase().trim();
    const verification = await authRepository.findVerificationByEmailAndType(
        normalizedEmail, "RESET_PASSWORD"
    );

    if (!verification) {
        throw new ServiceError(
            "Không tìm thấy mã OTP hợp lệ. Vui lòng yêu cầu mã mới.",
            404, "VERIFICATION_NOT_FOUND"
        );
    }

    // Check lockout
    if (verification.isLocked && verification.lockedUntil) {
        const now = new Date();
        if (verification.lockedUntil > now) {
            const remainingSeconds = Math.ceil((verification.lockedUntil - now) / 1000);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            throw new ServiceError(
                `Bạn đã nhập sai quá 5 lần. Tài khoản bị khóa ${minutes} phút ${seconds} giây.`,
                429, "EMAIL_LOCKED", { lock_remaining_seconds: remainingSeconds }
            );
        }
    }

    // Check expiry: createdAt + 10 minutes < NOW
    const now = new Date();
    const otpAgeMinutes = (now - verification.lastSendAt) / (1000 * 60);
    if (otpAgeMinutes > 10) {
        throw new ServiceError(
            "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
            400, "OTP_EXPIRED"
        );
    }

    const isValid = await verifyOTPHash(otp, verification.otpHash);

    if (!isValid) {
        const newAttempts = verification.attempts + 1;
        const updateData = { attempts: newAttempts };

        if (newAttempts >= 5) {
            updateData.isLocked = true;
            updateData.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
        }

        await authRepository.updateVerification(normalizedEmail, updateData, "RESET_PASSWORD");

        if (newAttempts >= 5) {
            throw new ServiceError(
                "Bạn đã nhập sai quá 5 lần. Tài khoản bị khóa 15 phút.",
                429, "EMAIL_LOCKED"
            );
        }

        throw new ServiceError(
            `Mã OTP không đúng. Bạn còn ${5 - newAttempts} lần thử.`,
            400, "INVALID_OTP"
        );
    }

    return {
        verified: true,
        message: "Mã OTP xác thực thành công.",
    };
};

/**
 * Reset password with verified OTP
 * Implements UC07: US1 (Successful password reset)
 *
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<Object>}
 * @throws {ServiceError} 400/403/404/429/500
 */


/**
 * Change password for authenticated user
 * Implements UC06: User Story 1 - Thay doi mat khau thanh cong
 *
 * Business Logic Flow:
 * 1. Find user by userId from JWT (NOT from request body — anti-IDOR)
 * 2. Check account is active (is_active = TRUE)
 * 3. Verify oldPassword with bcrypt.compare() (constant-time)
 * 4. Hash newPassword with bcrypt (12 rounds)
 * 5. Update password_hash in database
 * 6. Audit log CHANGE_PASSWORD_SUCCESS
 * 7. Keep current session active (do NOT force logout)
 *
 * @param {number} userId - User ID from JWT token (req.user.user_id)
 * @param {string} oldPassword - Current password for verification
 * @param {string} newPassword - New password (already validated by Zod)
 * @returns {Promise<Object>} Success response
 * @throws {ServiceError} 400 - Old password incorrect
 * @throws {ServiceError} 403 - Account inactive
 */
const changePassword = async (userId, oldPassword, newPassword) => {
    // 1. Find user by userId (from JWT, NOT request body)
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new ServiceError(
            "Tài khoản không tồn tại.",
            404,
            "USER_NOT_FOUND"
        );
    }

    // 2. Check account is active
    if (!user.isActive) {
        throw new ServiceError(
            "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
            403,
            "ACCOUNT_DISABLED"
        );
    }

    // 3. Verify oldPassword with bcrypt (constant-time comparison)
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
        logger.warn({ userId, reason: "old_password_incorrect" }, "CHANGE_PASSWORD_FAILED");

        throw new ServiceError(
            "Mật khẩu cũ không chính xác.",
            400,
            "INVALID_OLD_PASSWORD"
        );
    }

    // 4. Hash newPassword with bcrypt (12 rounds)
    const newHash = await bcrypt.hash(newPassword, 12);

    // 5. Update password in database
    await authRepository.updatePassword(user.email, newHash);

    // 6. Audit log success (no passwords in log)
    logger.info({ userId }, "CHANGE_PASSWORD_SUCCESS");

    // 7. Return success - session unchanged (keep JWT active)
    return {
        success: true,
        message: "Mật khẩu đã được thay đổi thành công",
    };
};

const resetPassword = async (email, otp, newPassword) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Re-verify OTP
    await verifyResetOTP(normalizedEmail, otp);

    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        throw new ServiceError(
            "Không tìm thấy tài khoản với email này.",
            404, "USER_NOT_FOUND"
        );
    }

    if (!user.isActive) {
        throw new ServiceError(
            "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
            403, "ACCOUNT_DISABLED"
        );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await authRepository.updatePassword(normalizedEmail, passwordHash);
    await authRepository.deleteVerification(normalizedEmail, "RESET_PASSWORD");

    return {
        success: true,
        message: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.",
    };
};
export default {
    loginService,
    sendOTP,
    verifyOTP,
    requestResetPassword,
    verifyResetOTP,
    resetPassword,
    changePassword,
};