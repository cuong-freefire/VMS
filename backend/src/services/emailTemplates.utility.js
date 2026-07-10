/**
 * Email Templates — Trình tạo giao diện HTML cho từng loại email
 * Người phụ trách: Member 1 (CuongLH) — MD15 Email Service
 *
 * File này chứa 6 hàm dựng template HTML cho 5 loại email:
 *   UC62 — Xác thực tài khoản (OTP đăng ký)
 *   UC63 — Đặt lại mật khẩu (OTP quên mật khẩu)
 *   UC64 — Thông báo duyệt / từ chối đơn đăng ký sự kiện
 *   UC65 — Nhắc nhở sự kiện trước 24h
 *   UC66 — Gửi chứng nhận tham gia (kèm file PDF)
 *
 * Nguyên tắc:
 *   - Chỉ dùng JavaScript Template Literals, không dùng Handlebars / EJS
 *   - Mỗi hàm trả về chuỗi HTML hoàn chỉnh, sẵn sàng đưa vào NodeMailer
 *   - Hỗ trợ UTF-8 đầy đủ cho tiếng Việt và emoji
 *   - Tự động thay thế giá trị rỗng bằng text mặc định ("N/A", "người dùng", ...)
 */

// ─── UC62: Xác thực tài khoản ───────────────────

/**
 * Email chứa mã OTP để xác thực tài khoản mới đăng ký.
 *
 * @param {string} userName — Tên hiển thị của người nhận
 * @param {string} otpCode — Mã OTP 6 chữ số
 * @param {number} expiryMinutes — Thời gian hết hạn (phút), mặc định 10
 * @returns {string} Chuỗi HTML hoàn chỉnh
 */
export const buildVerificationOtpTemplate = (userName, otpCode, expiryMinutes = 10) => {
    const safeName = userName || "người dùng";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 24px;">Xác thực tài khoản VMS</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Bạn đã yêu cầu đăng ký tài khoản mới trên Hệ thống Quản lý Tình nguyện (VMS).</p>

      <div style="background-color: #d4e9e2; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="color: rgba(0,0,0,0.58); font-size: 14px; margin: 0 0 8px 0;">Mã xác thực của bạn</p>
        <p style="color: #006241; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; margin: 0;">${otpCode}</p>
      </div>

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Mã này có hiệu lực trong <strong>${expiryMinutes} phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>

      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: rgba(0,0,0,0.87); font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Hướng dẫn:</p>
        <ol style="color: rgba(0,0,0,0.58); font-size: 14px; margin: 0; padding-left: 20px;">
          <li>Quay lại ứng dụng VMS</li>
          <li>Nhập mã xác thực: <strong>${otpCode}</strong></li>
          <li>Hoàn tất đăng ký tài khoản</li>
        </ol>
      </div>

      <p style="color: rgba(0,0,0,0.58); font-size: 14px; line-height: 1.5;">Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

// ─── UC63: Đặt lại mật khẩu ──────────────────────

/**
 * Email chứa mã OTP để đặt lại mật khẩu.
 *
 * @param {string} userName — Tên hiển thị của người nhận
 * @param {string} otpCode — Mã OTP 6 chữ số
 * @param {number} expiryMinutes — Thời gian hết hạn (phút), mặc định 10
 * @returns {string} Chuỗi HTML hoàn chỉnh
 */
export const buildResetPasswordOtpTemplate = (userName, otpCode, expiryMinutes = 10) => {
    const safeName = userName || "người dùng";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 24px;">Đặt lại mật khẩu VMS</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VMS của bạn.</p>

      <div style="background-color: #d4e9e2; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="color: rgba(0,0,0,0.58); font-size: 14px; margin: 0 0 8px 0;">Mã OTP đặt lại mật khẩu</p>
        <p style="color: #006241; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; margin: 0;">${otpCode}</p>
      </div>

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Mã này có hiệu lực trong <strong>${expiryMinutes} phút</strong>.</p>

      <div style="background-color: #fff3e0; border-left: 4px solid #fbbc05; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <p style="color: rgba(0,0,0,0.87); font-size: 14px; font-weight: 600; margin: 0;">
          ⚠ Cảnh báo bảo mật
        </p>
        <p style="color: rgba(0,0,0,0.58); font-size: 14px; margin: 8px 0 0 0;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

// ─── UC64: Duyệt đơn đăng ký sự kiện ────────────

/**
 * Email thông báo đơn đăng ký sự kiện đã được duyệt.
 *
 * @param {string} volunteerName — Tên tình nguyện viên
 * @param {string} eventName — Tên sự kiện
 * @param {string} eventStartTime — Thời gian bắt đầu sự kiện (đã format)
 * @param {string} eventLocation — Địa điểm tổ chức (có thể bỏ trống)
 * @returns {string} Chuỗi HTML hoàn chỉnh
 */
export const buildApprovalTemplate = (volunteerName, eventName, eventStartTime, eventLocation = "") => {
    const safeName = volunteerName || "Tình nguyện viên";
    const safeEvent = eventName || "sự kiện";
    const safeTime = eventStartTime || "N/A";
    const locationSection = eventLocation
        ? `<p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;"><strong>Địa điểm:</strong> ${eventLocation}</p>`
        : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">✅</span>
      </div>
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 16px; text-align: center;">Đơn đăng ký được chấp nhận</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Chúng tôi vui mừng thông báo rằng đơn đăng ký tham gia sự kiện <strong>${safeEvent}</strong> của bạn đã được <span style="color: #00754A; font-weight: 600;">chấp nhận</span>! 🎉
      </p>

      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: rgba(0,0,0,0.87); font-size: 14px; margin: 0 0 8px 0;"><strong>Thời gian sự kiện:</strong> ${safeTime}</p>
        ${locationSection}
      </div>

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Vui lòng kiểm tra ứng dụng VMS để xem thông tin chi tiết và chuẩn bị cho sự kiện.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

// ─── UC64: Từ chối đơn đăng ký sự kiện ───────────

/**
 * Email thông báo đơn đăng ký sự kiện bị từ chối.
 *
 * @param {string} volunteerName — Tên tình nguyện viên
 * @param {string} eventName — Tên sự kiện
 * @param {string} reason — Lý do từ chối (có thể bỏ trống)
 * @returns {string} Chuỗi HTML hoàn chỉnh
 */
export const buildRejectionTemplate = (volunteerName, eventName, reason = "") => {
    const safeName = volunteerName || "Tình nguyện viên";
    const safeEvent = eventName || "sự kiện";
    const reasonSection = reason
        ? `<div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
             <p style="color: rgba(0,0,0,0.87); font-size: 14px; margin: 0;"><strong>Lý do:</strong> ${reason}</p>
           </div>`
        : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 16px;">Đơn đăng ký không được chấp nhận</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Thật không may, đơn đăng ký tham gia sự kiện <strong>${safeEvent}</strong> của bạn
        <span style="color: #c82014; font-weight: 600;">không được chấp nhận</span> lần này.
      </p>

      ${reasonSection}

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Đừng nản lòng! Vẫn còn nhiều sự kiện tình nguyện khác đang chờ bạn.
        Hãy tiếp tục theo dõi ứng dụng VMS để tìm sự kiện phù hợp.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

// ─── UC65: Nhắc nhở sự kiện (trước 24h) ──────────
// LƯU Ý: Cron job UC65 chưa triển khai. Template này dùng khi cron job được thêm sau.

/**
 * Email nhắc nhở tình nguyện viên 24h trước giờ sự kiện.
 *
 * @param {string} volunteerName — Tên tình nguyện viên
 * @param {string} eventName — Tên sự kiện
 * @param {string} eventStartTime — Thời gian bắt đầu sự kiện (đã format)
 * @param {string} eventLocation — Địa điểm tổ chức (có thể bỏ trống)
 * @returns {string} Chuỗi HTML hoàn chỉnh
 */
export const buildReminderTemplate = (volunteerName, eventName, eventStartTime, eventLocation = "") => {
    const safeName = volunteerName || "Tình nguyện viên";
    const safeEvent = eventName || "sự kiện";
    const safeTime = eventStartTime || "N/A";
    const locationSection = eventLocation
        ? `<p style="color: rgba(0,0,0,0.87); font-size: 14px; margin: 4px 0 0 0;"><strong>Địa điểm:</strong> ${eventLocation}</p>`
        : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">📅</span>
      </div>
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 16px; text-align: center;">${safeEvent} sắp diễn ra</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Sự kiện <strong>${safeEvent}</strong> sẽ diễn ra trong vòng <strong>24 giờ</strong> tới!
      </p>

      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: rgba(0,0,0,0.87); font-size: 14px; margin: 0 0 4px 0;"><strong>Thời gian:</strong> ${safeTime}</p>
        ${locationSection}
      </div>

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Vui lòng chuẩn bị sẵn sàng và đến đúng giờ. Chúng tôi rất mong được gặp bạn!</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

// ─── UC66: Gửi chứng nhận tham gia ───────────────
// LƯU Ý: Chưa tích hợp với CertificateService. Hàm này chờ module chứng nhận gọi.

/**
 * Email gửi kèm file PDF chứng nhận hoàn thành sự kiện.
 *
 * @param {string} volunteerName — Tên tình nguyện viên
 * @param {string} eventName — Tên sự kiện đã hoàn thành
 * @returns {string} Chuỗi HTML hoàn chỉnh (file PDF do EmailService đính kèm)
 */
export const buildCertificateTemplate = (volunteerName, eventName) => {
    const safeName = volunteerName || "Tình nguyện viên";
    const safeEvent = eventName || "sự kiện";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f2f0eb;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎓</span>
      </div>
      <h1 style="color: #006241; font-size: 24px; margin-bottom: 16px; text-align: center;">Chứng nhận tham gia</h1>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Xin chào ${safeName},</p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Chúc mừng bạn đã hoàn thành sự kiện <strong>${safeEvent}</strong>! 🎉
      </p>
      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">
        Chứng nhận điện tử của bạn được đính kèm trong email này. Vui lòng tải về và lưu trữ.
      </p>

      <div style="background-color: #d4e9e2; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: rgba(0,0,0,0.87); font-size: 14px; margin: 0;">
          💡 <strong>Mẹo:</strong> Bạn có thể chia sẻ chứng nhận này lên mạng xã hội hoặc đính kèm vào hồ sơ tình nguyện của mình.
        </p>
      </div>

      <p style="color: rgba(0,0,0,0.87); font-size: 16px; line-height: 1.5;">Cảm ơn bạn đã tham gia và đóng góp cho cộng đồng! 🙏</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: rgba(0,0,0,0.58); font-size: 13px; line-height: 1.5;">
        Email tự động từ Hệ thống Quản lý Tình nguyện (VMS)<br>
        Vui lòng không trả lời email này.
      </p>
    </div>
  </body>
</html>`;
};

export default {
    buildVerificationOtpTemplate,
    buildResetPasswordOtpTemplate,
    buildApprovalTemplate,
    buildRejectionTemplate,
    buildReminderTemplate,
    buildCertificateTemplate,
};
