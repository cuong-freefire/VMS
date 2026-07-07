import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Thêm timeout và retry
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

// // Verify connection khi server start
// export const verifyTransporter = async () => {
//     try {
//         await transporter.verify();
//         console.log("✅ SMTP connection verified");
//         return true;
//     } catch (error) {
//         console.error("❌ SMTP connection failed:", error.message);
//         return false;
//     }
// };