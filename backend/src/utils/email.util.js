/**
 * Email Template Utility - Generate email content for OTP verification
 * Owner: Member 1 (CuongLH)
 * 
 * Responsibilities:
 * - Generate plain text OTP email content
 * - Include OTP validity duration
 * - Provide clear instructions for user
 * 
 * Security Notes:
 * - OTP is included in plaintext in email (acceptable for OTP delivery)
 * - No sensitive data other than OTP is included
 * - Email is sent via SMTP with TLS encryption
 */

/**
 * Generate OTP email content in plain text format
 * @param {string} otp - 6-digit OTP to include in email
 * @param {number} otpValidityMinutes - OTP validity duration in minutes (default: 10)
 * @returns {Object} Object with subject and plaintext body
 */
export const generateOTPEmailContent = (otp, otpValidityMinutes = 10) => {
    const subject = 'Mã xác thực đăng ký tài khoản VMS';

    const plainText = `
Xin chào,

Bạn đã yêu cầu đăng ký tài khoản mới trên Hệ thống Quản lý Tình nguyện (VMS).

Mã xác thực của bạn là: ${otp}

Mã này có hiệu lực trong ${otpValidityMinutes} phút. Vui lòng không chia sẻ mã này với bất kỳ ai.

Hướng dẫn:
1. Quay lại ứng dụng VMS
2. Nhập mã xác thực: ${otp}
3. Hoàn tất đăng ký tài khoản

Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.

---
Đây là email tự động từ hệ thống VMS. Vui lòng không trả lời email này.
Volunteer Management System (VMS)
`.trim();

    return {
        subject,
        plainText,
    };
};

export default {
    generateOTPEmailContent,
};
