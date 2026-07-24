/**
 * NodeMailer Transporter Configuration
 * Owner: Member 1 (CuongLH) — MD15 Email Service
 *
 * Single shared transporter instance for the entire application.
 * Uses Gmail SMTP with connection pooling for performance.
 *
 * Security Notes:
 * - Credentials from process.env ONLY (never hardcoded)
 * - TLS encryption enforced via service: "gmail"
 * - UTF-8 encoding set explicitly for Vietnamese + emoji support
 */

import nodemailer from "nodemailer";
import logger from "./logger.config.js";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // Đợi tối đa 10 giây để kết nối tới SMTP.
    greetingTimeout: 10000, // Sau khi kết nối thành công, Gmail sẽ gửi lời chào SMTP. Nếu quá 10 giây mà chưa nhận được lời chào thì hủy kết nối.
    socketTimeout: 10000, // Trong lúc gửi email, nếu socket không có dữ liệu trong 10 giây thì đóng kết nối.
    maxConnections: 5, // Cho phép tối đa 5 kết nối SMTP đồng thời. 
    maxMessages: 100, // Mỗi kết nối sẽ gửi tối đa 100 email rồi tự đóng và mở lại kết nối mới
    rateDelta: 1000, // Khoảng thời gian tính giới hạn tốc độ, tính bằng milliseconds.
    rateLimit: 14, // Cho phép gửi tối đa 14 email trong mỗi rateDelta
});

/**
 * Verify SMTP connection on startup.
 * Called by EmailService constructor.
 *
 * @returns {Promise<boolean>} true if connection OK, false otherwise
 */
export const verifyTransporter = async () => {
    try {
        await transporter.verify();
        logger.info("SMTP connection verified successfully");
        return true;
    } catch (error) {
        logger.error({ err: error }, "SMTP connection failed");
        return false;
    }
};
