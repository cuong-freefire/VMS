import { signAccessToken } from "../utils/jwt.util.js";
import { ServiceError } from "../utils/response.util.js";
import bcrypt from "bcryptjs";
import { generateOTP, hashOTP, verifyOTP as verifyOTPHash } from "../utils/otp.util.js";
import authRepository from "../repositories/auth.repository.js";
import logger from "../config/logger.config.js";
import emailService from "./email.service.js";

/**
 * Login service - Authenticate user with email and password
 * Implements UC03: User Story 1 - Đăng nhập thành công với tài khoản hợp lệ
 * 
 * Business Logic Flow:
 * 1. Kiểm tra tài khoản có đang bị khóa hay không (khóa sau 5 lần đăng nhập sai trong vòng 15 phút)
 * 2. Tìm người dùng theo email (không phân biệt chữ hoa/chữ thường)
 * 3. Xác thực mật khẩu bằng bcrypt.compare()
 * 4. Kiểm tra tài khoản còn hoạt động hay không (không bị xóa mềm)
 * 5. Kiểm tra email đã được xác minh hay chưa
 * 6. Tạo JWT kèm jti (Session ID)
 * 7. Tạo hoặc cập nhật phiên đăng nhập để đảm bảo chỉ có một phiên hoạt động (Single Active Session)
 * 8. Đặt lại số lần đăng nhập thất bại
 * 9. Trả về thông tin người dùng (không bao gồm password_hash)
 * 
 * @param {string} email - Email của người dùng
 * @param {string} password - Mật khẩu dạng văn bản thuần (Plain Text)
 * @returns {Promise<Object>} Đối tượng chứa JWT và thông tin người dùng
 * @throws {ServiceError} Ném lỗi 401 (Unauthorized), 403 (Forbidden) hoặc 429 (Too Many Requests)
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
            "Email hoặc mật khẩu chưa chính xác",
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
            "Email hoặc mật khẩu chưa chính xác",
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
        role_name: user.role.name,
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
            role_name: user.role.name,
            avatar_url: user.avatarUrl,
            phone: user.phone,
            created_at: user.createdAt ? user.createdAt.toISOString() : null,
        }
    };
}

/**
 * Gửi mã OTP đến email để xác thực đăng ký tài khoản
 * Triển khai UC04: User Story 1 - Gửi OTP để xác thực email
 *
 * Luồng xử lý nghiệp vụ:
 * - Kiểm tra email đã tồn tại trong bảng users hay chưa
 * - Kiểm tra thời gian chờ giữa các lần gửi lại OTP (60 giây)
 * - Kiểm tra trạng thái khóa sau 5 lần xác thực thất bại (15 phút)
 * - Tạo mã OTP gồm 6 chữ số và mã hóa (hash) trước khi lưu
 * - Lưu thông tin OTP vào bảng email_verifications
 * - Gửi email chứa mã OTP thông qua NodeMailer
 *
 * @param {string} email - Email của người dùng (đã được chuẩn hóa)
 * @returns {Promise<Object>} Đối tượng phản hồi thành công kèm thông tin thời gian chờ gửi lại OTP
 * @throws {ServiceError} Ném lỗi 400 (Bad Request), 409 (Conflict), 429 (Too Many Requests) hoặc 503 (Service Unavailable)
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

    // 10. Send verification OTP email via EmailService (MD15)
    emailService.sendVerificationEmail(normalizedEmail, normalizedEmail, otp, 10)
        .then((result) => {
            if (!result.success) {
                logger.warn({ email: normalizedEmail, error: result.error }, "OTP email send failed");
            }
        });

    // 11. Return success response
    return {
        success: true,
        message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
        cooldown_seconds: 60,
    };
};

/**
 * Xác thực mã OTP và tạo tài khoản người dùng
 * Triển khai UC04: User Story 2 - Xác thực OTP và tạo tài khoản thành công
 *
 * Luồng xử lý nghiệp vụ:
 * - Kiểm tra tính hợp lệ của toàn bộ dữ liệu đầu vào bằng Zod
 * - Tìm bản ghi xác thực OTP
 * - Kiểm tra trạng thái khóa sau nhiều lần xác thực thất bại
 * - Kiểm tra thời hạn của mã OTP (10 phút)
 * - Xác thực mã OTP bằng bcrypt.compare()
 * - Mã hóa mật khẩu bằng bcryptjs (12 rounds)
 * - Tạo tài khoản người dùng trong một transaction
 * - Xóa bản ghi xác thực OTP sau khi tạo tài khoản thành công
 *
 * @param {Object} payload - Dữ liệu xác thực
 * @param {string} payload.email - Email của người dùng
 * @param {string} payload.otp - Mã OTP gồm 6 chữ số
 * @param {string} payload.fullName - Họ và tên
 * @param {string} payload.phoneNumber - Số điện thoại
 * @param {string} payload.password - Mật khẩu
 * @returns {Promise<Object>} Đối tượng phản hồi thành công chứa user_id
 * @throws {ServiceError} Ném lỗi 400 (Bad Request), 429 (Too Many Requests) hoặc 500 (Internal Server Error)
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
 * Gửi yêu cầu cấp mã OTP để đặt lại mật khẩu
 * Triển khai UC07:
 * - User Story 1: Quên mật khẩu
 * - User Story 4: Ngăn chặn dò tìm tài khoản (Zero User Enumeration)
 *
 * Luồng xử lý nghiệp vụ:
 * - Kiểm tra thời gian chờ giữa các lần gửi lại OTP
 * - Nếu email tồn tại, tạo và lưu mã OTP đặt lại mật khẩu
 * - Gửi email chứa mã OTP đến người dùng
 * - Nếu email không tồn tại, vẫn trả về phản hồi thành công
 *   để tránh tiết lộ sự tồn tại của tài khoản
 *
 * @param {string} email - Email của người dùng
 * @returns {Promise<Object>} Đối tượng phản hồi thành công
 * @throws {ServiceError} Ném lỗi 429 (Too Many Requests)
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

    // Send reset password OTP email via EmailService (MD15)
    emailService.sendResetPasswordEmail(normalizedEmail, normalizedEmail, otp, 10)
        .then((result) => {
            if (!result.success) {
                logger.warn({ email: normalizedEmail, error: result.error }, "Reset password email send failed");
            }
        });

    logger.info({ email: normalizedEmail }, "FORGOT_PASSWORD_OTP_SENT");

    return {
        success: true,
        message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư.",
        cooldown_seconds: 60,
    };
};

/**
 * Xác thực mã OTP để đặt lại mật khẩu
 * Triển khai UC07:
 * - User Story 1: Xác thực OTP để đặt lại mật khẩu
 * - User Story 2: Khóa xác thực sau 5 lần nhập sai OTP
 *
 * Luồng xử lý nghiệp vụ:
 * - Tìm bản ghi OTP theo email
 * - Kiểm tra trạng thái khóa do nhập sai quá nhiều lần
 * - Kiểm tra mã OTP còn hiệu lực hay đã hết hạn
 * - Xác thực mã OTP bằng bcrypt.compare()
 * - Tăng số lần nhập sai nếu OTP không chính xác
 * - Đánh dấu OTP đã được xác thực thành công
 *
 * @param {string} email - Email của người dùng
 * @param {string} otp - Mã OTP gồm 6 chữ số
 * @returns {Promise<Object>} Đối tượng phản hồi với trạng thái xác thực thành công ({ verified: true })
 * @throws {ServiceError} Ném lỗi 400 (Bad Request), 404 (Not Found) hoặc 429 (Too Many Requests)
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
            logger.warn({ email: normalizedEmail, attempts: newAttempts }, "FORGOT_PASSWORD_LOCKOUT");
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

    logger.info({ email: normalizedEmail }, "FORGOT_PASSWORD_OTP_VERIFIED");

    return {
        verified: true,
        message: "Mã OTP xác thực thành công.",
    };
};

/**
 * Thay đổi mật khẩu cho người dùng đã đăng nhập
 * Triển khai UC06: User Story 1 - Thay đổi mật khẩu thành công
 *
 * Luồng xử lý nghiệp vụ:
 * 1. Tìm người dùng theo userId lấy từ JWT
 *    (KHÔNG lấy từ request body để ngăn chặn lỗ hổng IDOR)
 * 2. Kiểm tra tài khoản còn hoạt động (is_active = TRUE)
 * 3. Xác thực mật khẩu hiện tại bằng bcrypt.compare()
 *    (so sánh theo thời gian hằng để tăng tính bảo mật)
 * 4. Mã hóa mật khẩu mới bằng bcrypt (12 rounds)
 * 5. Cập nhật password_hash trong cơ sở dữ liệu
 * 6. Ghi nhật ký kiểm toán (Audit Log) với sự kiện CHANGE_PASSWORD_SUCCESS
 * 7. Giữ nguyên phiên đăng nhập hiện tại
 *    (KHÔNG tự động đăng xuất sau khi đổi mật khẩu)
 *
 * @param {number} userId - ID người dùng lấy từ JWT (req.user.user_id)
 * @param {string} oldPassword - Mật khẩu hiện tại để xác thực
 * @param {string} newPassword - Mật khẩu mới (đã được Zod kiểm tra hợp lệ)
 * @returns {Promise<Object>} Đối tượng phản hồi thành công
 * @throws {ServiceError} Ném lỗi 400 (Bad Request) nếu mật khẩu hiện tại không chính xác
 * @throws {ServiceError} Ném lỗi 403 (Forbidden) nếu tài khoản không còn hoạt động
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
    await authRepository.updatePasswordById(user.id, newHash);

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

    logger.info({ email: normalizedEmail }, "FORGOT_PASSWORD_SUCCESS");

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
