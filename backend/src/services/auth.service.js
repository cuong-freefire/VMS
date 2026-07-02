import { signAccessToken } from "../utils/jwt.util.js";
import { ServiceError } from "../utils/response.util.js";
import bcrypt from "bcryptjs";
import { generateOTP, hashOTP, verifyOTP as verifyOTPHash } from "../utils/otp.util.js";
import { generateOTPEmailContent } from "../utils/email.util.js";
import * as authRepository from "../repositories/auth.repository.js";
import { transporter } from "../config/transporter.config.js";

export function loginService(email, password) {
    const accounts = [
        { email: 'cuong123', password: 'cuong123', name: 'Tèo' },
        { email: 'cute73998@gmail.com', password: 'cuong123', name: 'Trung' },
        { email: 'tandava2005@gmail.com', password: 'cuong123', name: 'Phú' }
    ]

    const user = accounts.find(acc => acc.email === email && acc.password === password);

    if (!user) {
        throw new ServiceError(
            "Email hoặc mật khẩu chưa chính xác",
            401,
            "UNAUTHORIZED"
        );
    }

    const token = signAccessToken(user)

    return {
        token, user
    }
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
export const sendOTP = async (email) => {
    // 1. Validate email format (already done by Zod middleware)
    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if email exists in users table
    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser && existingUser.isActive) {
        throw new ServiceError(
            "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.",
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
            const remainingSeconds = 60 - timeSinceLastSend;
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
        } else {
            // Lock expired, reset it
            await authRepository.updateVerification(normalizedEmail, {
                isLocked: false,
                attempts: 0,
                lockedUntil: null,
            });
            verification = null;
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
export const verifyOTP = async (payload) => {
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

export default {
    loginService,
    sendOTP,
    verifyOTP,
};
