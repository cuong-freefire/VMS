# TASKS: Email Services (Module 15)

**Tác giả**: CuongLH | **Ngày**: 2026-07-10 | **Trạng thái**: Hoàn thành ~88% (30/34 task)

**Input**: Design documents trong `.sdd\CuongLH\MD15-email-service\` — spec.md, plan.md, research.md, data-model.md, contracts/service-contract.md

**Prerequisites**: SPEC.md (required for user stories), PLAN.md (required for architecture), contracts/service-contract.md (required for API signatures)

**Tổ chức**: Tasks được nhóm theo từng User Story để có thể triển khai và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Mô tả — đường dẫn file cụ thể`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc)
- **[Story]**: Task này thuộc User Story nào (US1, US2, US3)
- Kèm đường dẫn file chính xác trong mỗi task

---

## Phase 1: Setup (Shared Infrastructure) — Hạ tầng chung

**Mục đích**: Khởi tạo project structure, cài đặt dependencies, cấu hình môi trường

- [x] T001 Tạo thư mục `backend/tests/email/` cho test files của Email Service
- [x] T002 [P] Xác nhận dependency `nodemailer` đã có trong `package.json` (phiên bản ≥6.9.x)
- [x] T003 [P] Cài đặt `node-cron@^3.0.x` cho UC65 Event Reminder Cron Job: `npm install node-cron@^3.0.x`
- [x] T004 [P] Xác nhận biến môi trường SMTP trong `backend/.env`: `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`

**Checkpoint**: Môi trường sẵn sàng — có thể bắt đầu code nền tảng

---

## Phase 2: Foundational (Blocking Prerequisites) — Nền tảng cốt lõi

**Mục đích**: Hạ tầng cốt lõi mà TẤT CẢ User Story đều phụ thuộc vào

**⚠️ QUAN TRỌNG**: Không User Story nào được bắt đầu cho đến khi Phase này hoàn tất

- [x] T005 Tạo file `backend/src/config/transporter.config.js` — Cấu hình NodeMailer transporter dùng chung: service Gmail, connection pooling (max 5 connections, max 100 messages, rateLimit 14/s), timeout 10s, `verifyTransporter()` để kiểm tra kết nối khi khởi động
- [x] T006 [P] Tạo file `backend/src/services/emailTemplates.utility.js` — 6 hàm build HTML template dùng JavaScript Template Strings (native): `buildVerificationOtpTemplate`, `buildResetPasswordOtpTemplate`, `buildApprovalTemplate`, `buildRejectionTemplate`, `buildReminderTemplate`, `buildCertificateTemplate`. Tất cả template có `<meta charset="UTF-8">`, responsive design, fallback values cho trường rỗng
- [x] T007 [P] Tạo file `backend/src/services/email.service.js` — Hàm `sendEmail(to, subject, html, attachments)` dùng chung: bọc `transporter.sendMail()`, trả về `{ success, messageId?, error? }`, log Pino cho success/failure, KHÔNG throw exception. Gọi `verifyTransporter()` khi module load
- [x] T008 Sửa file `backend/src/services/auth.service.js` — Import `emailService` từ `./email.service.js`. Thay thế logic gửi mail trực tiếp bằng `emailService.sendVerificationEmail()` (trong `sendOTP`) và `emailService.sendResetPasswordEmail()` (trong `requestResetPassword`). Dùng fire-and-forget pattern (`.then().catch()`), không chặn luồng chính
- [x] T009 [P] Kiểm tra Pino logger hoạt động: log success/failure gửi mail KHÔNG chứa `SMTP_PASS`, plaintext OTP, hoặc dữ liệu nhạy cảm

**Checkpoint**: Nền tảng hoàn tất — các User Story có thể bắt đầu triển khai song song

---

## Phase 3: User Story 1 — UC62 (Xác thực Email) + UC63 (Đặt lại Mật khẩu) (Priority: P1) 🎯 MVP

**Mục tiêu**: Người dùng nhận được email chứa mã OTP 6 chữ số để xác thực tài khoản mới (UC62) hoặc đặt lại mật khẩu (UC63). Email gửi bất đồng bộ, không chặn luồng nghiệp vụ chính.

**Kiểm thử độc lập**: Đăng ký tài khoản mới → kiểm tra hộp thư có email chứa mã OTP → nhập OTP vào ứng dụng → tài khoản được kích hoạt. Hoặc: Yêu cầu quên mật khẩu → nhận OTP qua email → đặt lại mật khẩu thành công.

### Triển khai cho User Story 1

- [x] T010 [P] [US1] Tạo hàm `sendVerificationEmail(email, userName, otpCode, expiryMinutes = 10)` trong `backend/src/services/email.service.js` — Gọi `buildVerificationOtpTemplate()`, gửi với subject "Xác thực tài khoản VMS"
- [x] T011 [P] [US1] Tạo hàm `sendResetPasswordEmail(email, userName, otpCode, expiryMinutes = 10)` trong `backend/src/services/email.service.js` — Gọi `buildResetPasswordOtpTemplate()`, gửi với subject "Đặt lại mật khẩu VMS"
- [x] T012 [P] [US1] Tạo template `buildVerificationOtpTemplate(userName, otpCode, expiryMinutes)` trong `backend/src/services/emailTemplates.utility.js` — HTML với: tên người dùng, mã OTP hiển thị nổi bật trong ô màu `#d4e9e2`, thời hạn 10 phút, hướng dẫn 3 bước nhập OTP. Fallback: userName rỗng → "người dùng"
- [x] T013 [P] [US1] Tạo template `buildResetPasswordOtpTemplate(userName, otpCode, expiryMinutes)` trong `backend/src/services/emailTemplates.utility.js` — HTML với: tên người dùng, mã OTP, thời hạn, cảnh báo bảo mật (ô vàng `#fff3e0`): "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này"
- [x] T014 [US1] Tích hợp `sendVerificationEmail()` vào `auth.service.js` — Hàm `sendOTP()` gọi `emailService.sendVerificationEmail()` sau khi lưu OTP vào DB. Dùng fire-and-forget: `.then(result => { if (!result.success) logger.warn(...) })`
- [x] T015 [US1] Tích hợp `sendResetPasswordEmail()` vào `auth.service.js` — Hàm `requestResetPassword()` gọi `emailService.sendResetPasswordEmail()` sau khi tạo OTP. Dùng fire-and-forget, tương tự UC62
- [x] T016 [US1] Manual test: Đăng ký tài khoản mới → kiểm tra email trong hộp thư → mã OTP hiển thị đúng, tiếng Việt có dấu, responsive trên mobile. Lặp lại với chức năng Quên mật khẩu

**Checkpoint**: UC62 + UC63 hoạt động độc lập — Người dùng nhận được OTP qua email cho cả đăng ký và quên mật khẩu

---

## Phase 4: User Story 2 — UC64 (Thông báo Xét duyệt) + UC65 (Nhắc nhở Sự kiện) (Priority: P2)

**Mục tiêu**: Tình nguyện viên nhận email khi đơn đăng ký sự kiện được duyệt/từ chối (UC64). Nhận email nhắc nhở 24h trước khi sự kiện bắt đầu (UC65).

**Kiểm thử độc lập**: Manager duyệt/từ chối đơn → tình nguyện viên nhận email thông báo. Cron job chạy hàng giờ → tình nguyện viên có `status='approved'` nhận email nhắc nhở 24h trước sự kiện.

### UC64: Thông báo xét duyệt (ĐÃ HOÀN THÀNH)

- [x] T017 [P] [US2] Tạo hàm `sendApprovalEmail(email, volunteerName, eventName, eventStartTime, eventLocation = "")` trong `backend/src/services/email.service.js` — Gọi `buildApprovalTemplate()`, subject: "✅ Đơn đăng ký được chấp nhận - {eventName}"
- [x] T018 [P] [US2] Tạo hàm `sendRejectionEmail(email, volunteerName, eventName, reason = "")` trong `backend/src/services/email.service.js` — Gọi `buildRejectionTemplate()`, subject: "Đơn đăng ký không được chấp nhận - {eventName}"
- [x] T019 [P] [US2] Tạo template `buildApprovalTemplate(volunteerName, eventName, eventStartTime, eventLocation)` trong `backend/src/services/emailTemplates.utility.js` — HTML với: icon ✅, tên sự kiện, thời gian, địa điểm (nếu có), hướng dẫn kiểm tra ứng dụng. Fallback: volunteerName → "Tình nguyện viên", eventName → "sự kiện"
- [x] T020 [P] [US2] Tạo template `buildRejectionTemplate(volunteerName, eventName, reason)` trong `backend/src/services/emailTemplates.utility.js` — HTML với: thông báo từ chối, lý do (nếu có), động viên "Đừng nản lòng! Vẫn còn nhiều sự kiện khác". Màu đỏ `#c82014` cho trạng thái từ chối

### UC65: Nhắc nhở sự kiện (CHƯA TRIỂN KHAI)

- [ ] T021 [P] [US2] Tạo template `buildReminderTemplate(volunteerName, eventName, eventStartTime, eventLocation)` trong `backend/src/services/emailTemplates.utility.js` — **(ĐÃ LÀM: template có sẵn)** HTML với: icon 📅, tên sự kiện, "24 giờ tới", thời gian, địa điểm. Fallback giống UC64
- [ ] T022 [US2] Tạo hàm `sendReminderEmail(email, volunteerName, eventName, eventStartTime, eventLocation = "")` trong `backend/src/services/email.service.js` — **(ĐÃ LÀM: hàm có sẵn)** Gọi `buildReminderTemplate()`, subject: "📅 Nhắc nhở: {eventName} sắp diễn ra"
- [ ] T023 [US2] Tạo file `backend/src/utils/cron.jobs.js` — Cấu hình `node-cron` schedule `0 * * * *` (hàng giờ). Logic: query events có `start_date` trong 24h tới, `status='active'`, `reminder_sent_at IS NULL` → lấy danh sách applications `status='approved'` → gửi `sendReminderEmail()` cho từng volunteer → UPDATE `events.reminder_sent_at = NOW()`. Import ESM: `import cron from "node-cron"`. Xử lý lỗi: try/catch, log Pino, không crash server
- [ ] T024 [US2] Thêm cột `reminder_sent_at TIMESTAMP NULLABLE` vào bảng `events` trong Prisma schema (`backend/prisma/schema.prisma`). Chạy migration: `npx prisma migrate dev --name add_reminder_sent_at_to_events`. Mục đích: ngăn gửi trùng lặp reminder cho cùng một sự kiện

**Checkpoint**: UC64 hoạt động (khi EventService của Member 3 gọi). UC65 cần Member 2 (Event) + Member 3 (Application) hoàn thành module để có thể query events và applications.

---

## Phase 5: User Story 3 — UC66 (Gửi Chứng nhận) (Priority: P3)

**Mục tiêu**: Tình nguyện viên nhận email kèm file PDF chứng nhận sau khi hoàn thành sự kiện. File PDF ≤ 5MB.

**Kiểm thử độc lập**: Phát hành chứng nhận cho tình nguyện viên → email gửi thành công kèm file PDF đính kèm.

### Triển khai cho User Story 3

- [x] T025 [P] [US3] Tạo hàm `sendCertificateEmail(email, volunteerName, eventName, pdfPath)` trong `backend/src/services/email.service.js` — Validate file: `fs.statSync(pdfPath)`, kiểm tra `fileSizeMB > 5` → từ chối + log. Nếu file OK: gọi `buildCertificateTemplate()`, đính kèm PDF với `contentType: "application/pdf"`, subject: "🎓 Chứng nhận tham gia - {eventName}"
- [x] T026 [P] [US3] Tạo template `buildCertificateTemplate(volunteerName, eventName)` trong `backend/src/services/emailTemplates.utility.js` — HTML với: icon 🎓, lời chúc mừng, tên sự kiện, mẹo chia sẻ chứng nhận lên mạng xã hội, lời cảm ơn 🙏
- [x] T027 [US3] Xử lý edge case trong `sendCertificateEmail`: file không tồn tại → `catch(fsError)` → return `{ success: false, error: "Lỗi tệp chứng chỉ: ..." }`. File >5MB → `logger.error({ fileSizeMB, maxMB: 5 })` → return lỗi
- [x] T028 [US3] Manual test: Tạo file PDF test (dưới 5MB) → gọi `sendCertificateEmail()` → kiểm tra email có attachment đúng tên file, đúng content type. Test file >5MB → xác nhận bị từ chối

**Checkpoint**: UC66 hoạt động độc lập — Cần CertificateService của Member 3 gọi hàm này khi chứng nhận được phát hành

---

## Phase 6: Polish & Cross-Cutting Concerns — Hoàn thiện & Kiểm thử

**Mục đích**: Testing, linting, documentation, quality assurance cho toàn bộ module

### Tests (ĐÃ HOÀN THÀNH)

- [x] T029 [P] Viết unit tests cho 6 template builders trong `backend/tests/email/emailTemplates.test.js` — Test: chứa đúng dynamic data (tên, OTP, sự kiện), fallback values cho tham số rỗng, HTML structure hợp lệ (`<!DOCTYPE html>`, `</html>`), UTF-8 charset, tiếng Việt có dấu
- [x] T030 [P] Viết integration tests cho EmailService trong `backend/tests/email/email.service.test.js` — Mock `sendEmail`, test 7 hàm export: success path (có `messageId`), error path (có `error`), `sendCertificateEmail` file not found → không gọi `sendEmail`, file size validation

### Tests (CHƯA HOÀN THÀNH)

- [ ] T031 [P] Viết tests cho `cron.jobs.js` trong `backend/tests/cron/cron.jobs.test.js` — **(Sẽ tạo cùng lúc với cron.jobs.js)** Mock cron trigger, assert `sendReminderEmail` được gọi đúng số lần, assert `reminder_sent_at` được set, assert không gửi lại khi `reminder_sent_at` đã có, assert bỏ qua event đã hủy

### Chất lượng Code

- [x] T032 [P] Chạy ESLint: `npm run lint` trong `backend/` — Đảm bảo 0 errors cho tất cả file MD15
- [x] T033 [P] Kiểm tra Pino logs: tất cả success/failure log có đủ `to`, `subject`, `messageId` (success) hoặc `error`, `code` (failure). KHÔNG có `SMTP_PASS`, plaintext OTP, hoặc password trong log output
- [ ] T034 Chạy `quickstart.md` validation: thực hiện từng bước trong quickstart guide — cài đặt, cấu hình, gửi test email từng loại, kiểm tra log. Đánh dấu checklist hoàn tất

---

## Phụ thuộc & Thứ tự Thực hiện

### Phụ thuộc giữa các Phase

- **Setup (Phase 1)**: Không phụ thuộc — bắt đầu ngay
- **Foundational (Phase 2)**: Phụ thuộc Phase 1 hoàn tất — CHẶN tất cả User Story
- **User Story 1 (Phase 3)**: Phụ thuộc Phase 2 hoàn tất
- **User Story 2 (Phase 4)**: Phụ thuộc Phase 2 hoàn tất. UC65 phụ thuộc Member 2 (Event) + Member 3 (Application)
- **User Story 3 (Phase 5)**: Phụ thuộc Phase 2 hoàn tất
- **Polish (Phase 6)**: Phụ thuộc tất cả User Story mong muốn hoàn tất

### Phụ thuộc giữa các User Story

- **US1 (UC62+UC63 — P1)**: Có thể bắt đầu sau Phase 2 — Không phụ thuộc Story khác
- **US2 (UC64+UC65 — P2)**: Có thể bắt đầu sau Phase 2 — UC64 độc lập, UC65 cần Member 2+3
- **US3 (UC66 — P3)**: Có thể bắt đầu sau Phase 2 — Cần CertificateService (Member 3) để gọi

### Trong mỗi User Story

- Template builders → Hàm service → Tích hợp auth.service → Manual test
- Task đánh dấu [P] có thể chạy song song

---

## Chiến lược Triển khai

### MVP (ĐÃ HOÀN THÀNH)

1. ✅ Phase 1: Setup
2. ✅ Phase 2: Foundational
3. ✅ Phase 3: US1 (UC62 + UC63)
4. ✅ **MVP hoạt động**: Người dùng nhận OTP qua email khi đăng ký và quên mật khẩu

### Giai đoạn hiện tại

1. ✅ Phase 5: US3 (UC66) — Gửi chứng nhận qua email
2. ✅ Phase 4 một phần: UC64 (Thông báo xét duyệt) — Hàm + template có sẵn, chờ EventService gọi
3. ✅ Phase 6 một phần: Tests cho email.service + emailTemplates
4. ❌ **Còn thiếu**: UC65 Cron Job (T021-T024) + Cron job tests (T031) + Quickstart validation (T034)

---

## Ghi chú

- [P] = khác file, không phụ thuộc — chạy được song song
- [Story] = gắn task vào User Story cụ thể để dễ truy vết
- Mỗi User Story có thể hoàn thành và kiểm thử độc lập
- Task đánh dấu ✅ là đã hoàn thành trong code hiện tại
- Task đánh dấu ❌ (không check) là chưa làm — tất cả thuộc UC65 Cron Job
- UC65 cần Member 2 (NamLD — Event) và Member 3 (TienTD — Application) hoàn thành module trước khi có thể triển khai cron job

---

**Tổng kết**: 30/34 task đã hoàn thành (88%). 4 task còn lại đều thuộc UC65 Event Reminder (P2), bị chặn bởi module Event và Application chưa hoàn thiện.
