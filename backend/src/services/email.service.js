/**

* Dịch vụ Email — Logic Gửi Email Tập Trung

* Chủ sở hữu: Thành viên 1 (CuongLH) — Dịch vụ Email MD15

*

* Trách nhiệm:

* - Gửi cả 5 loại email (UC62–UC66) qua NodeMailer

* - Xử lý lỗi: ghi nhật ký lỗi, không bao giờ làm gián đoạn luồng nghiệp vụ chính

* - Async/await (không chặn) — không bao giờ chặn dịch vụ gọi

*

* Kiến trúc:

* - Được gọi bởi AuthService, EventService, CertificateService thông qua contract

* - Sử dụng transporter dùng chung từ transporter.config.js

* - Mẫu HTML từ emailTemplates.utility.js

*

* Quyết định thiết kế (theo research.md):

* - Sử dụng pool kết nối NodeMailer để gửi đồng thời

* - Sử dụng logger Pino cho thành công/thất bại (KHÔNG dùng console.log)

* - Sử dụng chuỗi mẫu JS cho mẫu HTML (KHÔNG dùng Handlebars)

* - Trả về { success, messageId?, error? } } — KHÔNG BAO GIỜ ném ngoại lệ
*/

import { transporter, verifyTransporter } from "../config/transporter.config.js";
import {
    buildVerificationOtpTemplate,
    buildResetPasswordOtpTemplate,
    buildApprovalTemplate,
    buildRejectionTemplate,
    buildReminderTemplate,
    buildCertificateTemplate,
} from "./emailTemplates.utility.js";
import logger from "../config/logger.config.js";
import fs from "fs";

// ─── Module Initialization ───────────────────────

verifyTransporter()
    .then(() => {
        logger.info("SMTP connection verified on startup");
    })
    .catch(() => {
        logger.warn("SMTP connection failed on startup. Emails will be attempted on send.");
    });


// ─── Core Send Function ──────────────────────────

/**
 * Chức năng gửi chính. Tất cả các loại email đều được xử lý qua chức năng này.
 *
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} html - HTML email body
 * @param {Array} attachments - Tệp đính kèm tùy chọn
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async (to, subject, html, attachments = []) => {
    try {
        const mailOptions = {
            from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            attachments,
        };

        const info = await transporter.sendMail(mailOptions);

        logger.info({ to, subject, messageId: info.messageId }, "Email sent successfully");
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(
            { to, subject, error: error.message, code: error.code },
            "Email send failed"
        );
        return { success: false, error: error.message };
    }
};

// ─── UC62: Xác minh email (Kích hoạt tài khoản) ───

/**
 * Gửi mã OTP xác thực qua email để đăng ký tài khoản mới.
 *
 * @param {string} email - Email người nhận
 * @param {string} userName - Display name
 * @param {string} otpCode - 6-digit OTP
 * @param {number} expiryMinutes - Thời hạn hiệu lực của mã OTP (mặc định: 10 phút)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendVerificationEmail = async (email, userName, otpCode, expiryMinutes = 10) => {
    const html = buildVerificationOtpTemplate(userName, otpCode, expiryMinutes);
    const subject = "Xác thực tài khoản VMS";
    return sendEmail(email, subject, html);
};

// ─── UC63: Quên mật khẩu (Đặt lại mật khẩu bằng mã OTP) ───

/**
 * Gửi email chứa mã OTP để đặt lại mật khẩu.
 *
 * @param {string} email - Email người nhận
 * @param {string} userName - Display name
 * @param {string} otpCode - 6-digit OTP
 * @param {number} expiryMinutes - Thời hạn hiệu lực của mã OTP (mặc định: 10 phút)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendResetPasswordEmail = async (email, userName, otpCode, expiryMinutes = 10) => {
    const html = buildResetPasswordOtpTemplate(userName, otpCode, expiryMinutes);
    const subject = "Đặt lại mật khẩu VMS";
    return sendEmail(email, subject, html);
};

// ─── UC64: Thông báo phê duyệt/từ chối sự kiện ───

/**
 * Gửi email thông báo xác nhận sự kiện.
 *
 * NOTE: EventService (Thành viên 3) phải gọi hàm này khi phê duyệt ứng dụng.
 *
 * @param {string} email - Email người nhận
 * @param {string} volunteerName - Volunteer display name
 * @param {string} eventName - Event name
 * @param {string} eventStartTime - Formatted event start time
 * @param {string} eventLocation - Event location (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendApprovalEmail = async (email, volunteerName, eventName, eventStartTime, eventLocation = "") => {
    const html = buildApprovalTemplate(volunteerName, eventName, eventStartTime, eventLocation);
    const subject = `\u2705 Đơn đăng ký được chấp nhận - ${eventName}`;
    return sendEmail(email, subject, html);
};

/**
 * Gửi email thông báo từ chối tham gia sự kiện.
 *
 * NOTE: EventService (Thành viên 3) phải gọi hàm này khi từ chối một đơn đăng ký tham gia của volunteer.
 *
 * @param {string} email - Email người nhận
 * @param {string} volunteerName - Volunteer display name
 * @param {string} eventName - Event name
 * @param {string} reason - Lý do từ chối (tùy chọn)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendRejectionEmail = async (email, volunteerName, eventName, reason = "") => {
    const html = buildRejectionTemplate(volunteerName, eventName, reason);
    const subject = `Đơn đăng ký không được chấp nhận - ${eventName}`;
    return sendEmail(email, subject, html);
};

// ─── UC65: Nhắc nhở sự kiện (24 giờ trước khi bắt đầu) ───

/**
 * Gửi email nhắc nhở sự kiện (24 giờ trước khi sự kiện bắt đầu).
 *
 * NOTE: UC65 cron job NOT implemented in this phase.
 * Chức năng này sẽ khả dụng cho tác vụ định kỳ (cron job) khi nó được added.
 *
 * @param {string} email - Email người nhận
 * @param {string} volunteerName - Volunteer display name
 * @param {string} eventName - Event name
 * @param {string} eventStartTime - Thời gian bắt đầu sự kiện được định dạng
 * @param {string} eventLocation - Địa điểm tổ chức sự kiện (tùy chọn)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendReminderEmail = async (email, volunteerName, eventName, eventStartTime, eventLocation = "") => {
    const html = buildReminderTemplate(volunteerName, eventName, eventStartTime, eventLocation);
    const subject = `\u{1F4C5} Nhắc nhở: ${eventName} sắp diễn ra`;
    return sendEmail(email, subject, html);
};

// ─── UC66: Email chứng nhận (Sau khi sự kiện hoàn tất) ───

/**
 * Gửi chứng chỉ qua email kèm tệp đính kèm PDF.
 * Kiểm tra kích thước tệp PDF trước khi gửi (tối đa 5MB).
 *
 * NOTE: CertificateService phải gọi phương thức này khi chứng chỉ được cấp.
 * Đang chờ tích hợp — CertificateService có thể chưa tồn tại.
 *
 * @param {string} email - Email người nhận
 * @param {string} volunteerName - Volunteer display name
 * @param {string} eventName - Tên sự kiện đã hoàn thành
 * @param {string} pdfPath - Đường dẫn tuyệt đối đến tệp PDF chứng chỉ
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendCertificateEmail = async (email, volunteerName, eventName, pdfPath) => {
    try {
        const stats = fs.statSync(pdfPath);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > 5) {
            logger.error(
                { email, eventName, fileSizeMB, maxMB: 5 },
                "Tệp chứng chỉ quá lớn — email bị từ chối"
            );
            return { success: false, error: "Tệp chứng chỉ vượt quá giới hạn 5MB. Không thể gửi." };
        }
    } catch (fsError) {
        logger.error(
            { email, eventName, pdfPath, error: fsError.message },
            "Không tìm thấy hoặc không thể đọc được tệp chứng chỉ."
        );
        return { success: false, error: `Lỗi tệp chứng chỉ: ${fsError.message}` };
    }

    const html = buildCertificateTemplate(volunteerName, eventName);
    const subject = `\u{1F393} Chứng nhận tham gia - ${eventName}`;
    const attachments = [
        {
            filename: `certificate-${eventName}.pdf`,
            path: pdfPath,
            contentType: "application/pdf",
        },
    ];

    return sendEmail(email, subject, html, attachments);
};

export default {
    sendEmail,
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendReminderEmail,
    sendCertificateEmail,
};
