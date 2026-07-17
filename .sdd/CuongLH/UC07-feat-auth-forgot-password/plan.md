# PLAN.md — Triển Khai: Quên Mật Khẩu (Forgot Password)

**Branch**: `CuongLH` | **Ngày**: 2026-07-07 | **Spec**: [spec.md](./spec.md)
**Trạng thái**: ACCEPTED

---

## 1. SUMMARY

**Yêu cầu từ spec.md**:

Triển khai luồng khôi phục mật khẩu 3 bước cho VMS:

- **Bước 1**: Người dùng nhập email → Hệ thống tạo mã OTP 6 chữ số, hash lưu DB, gửi email chứa OTP plaintext
- **Bước 2**: Người dùng nhập mã OTP → Hệ thống xác thực (kiểm tra hết hạn 10 phút, khóa sau 5 lần sai)
- **Bước 3**: Người dùng nhập mật khẩu mới → Hệ thống hash bcrypt, cập nhật DB, xóa OTP

**User Stories (theo spec.md)**:

| Story | Mô tả | Priority |
|-------|-------|----------|
| US1 | Khôi phục mật khẩu thành công (luồng chính) | P1 |
| US2 | Xử lý nhập sai OTP, lockout sau 5 lần | P2 |
| US3 | Gửi lại OTP mới, cooldown 60s, OTP hết hạn 10 phút | P2 |
| US4 | Chống dò quét tài khoản | P1 |

**Hướng tiếp cận kỹ thuật (từ research.md)**:

| Quyết định | Lựa chọn | Lý do |
|------------|----------|------|
| Sinh OTP | `crypto.randomInt(0, 1000000).toString().padStart(6, '0')` | An toàn, full 1M range, không bias |
| Lưu OTP | Bảng `email_verifications` dùng chung, phân biệt bằng cột `type` | Tránh trùng lặp code với UC04 |
| Hash OTP | bcrypt (10 rounds) | Bảo mật, nhanh hơn password hash |
| Chống tấn công dò tìm thông tin (Enumeration) | Luôn trả về success + fake OTP cho email không tồn tại | Ngăn timing attack |
| Gửi email | Gửi email Async qua `email.service.js` + `emailTemplates.utility.js`, lỗi im lặng | Không block API, không lộ thông tin |
| Frontend state | **`useState` local trong parent component** (single-page stepper) | Đơn giản, KHÔNG persist state qua refresh (theo EC5 spec) |

---

## 2. TECHNICAL CONTEXT

**Ngôn ngữ / Runtime**: Node.js v18+ + JavaScript ESM

**Dependencies chính**:

- Express 5.x (framework)
- Prisma ORM (database)
- MySQL 8.x (storage)
- Zod (input validation)
- bcryptjs (hash OTP + password, BCRYPT_SALT_ROUNDS=12)
- NodeMailer (gửi email)
- Pino (logging)

**Storage**: MySQL, bảng `email_verifications` (dùng chung với UC04 Register, phân biệt qua `type` enum), bảng `users`

**Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

**Nền tảng**: Web (Backend REST API + React SPA, desktop-first)

**Loại dự án**: Web service (backend) + Web application (frontend)

**Mục tiêu hiệu năng**:

| Endpoint | Target |
|----------|--------|
| POST /forgot-password/request | < 3s (gồm thời gian gửi email async) |
| POST /forgot-password/verify-otp | < 500ms |
| POST /forgot-password/reset | < 1s |
| Concurrent requests | 100 requests không lỗi/timeout |

**Ràng buộc**:

- **Không cho phép dò tìm tài khoản (Zero User Enumeration)**: Thông báo phản hồi và thời gian phản hồi phải gần như giống nhau đối với cả email tồn tại và không tồn tại (chênh lệch dưới 100 ms), tránh để kẻ tấn công suy đoán tài khoản hợp lệ.
- **Giới hạn thời gian gửi lại OTP (Cooldown)**: Chỉ cho phép gửi lại mã OTP sau **60 giây**, tính từ thời điểm gửi OTP gần nhất (`last_sent_at`).
- **Khóa tạm thời khi nhập sai nhiều lần (Lockout)**: Nếu nhập sai OTP **5 lần liên tiếp**, tài khoản sẽ bị khóa trong **15 phút**, sử dụng các trường `is_locked` và `locked_until` để quản lý.
- **Thời hạn hiệu lực của OTP (OTP TTL)**: Mã OTP chỉ có hiệu lực trong **10 phút**, tính từ thời điểm được tạo (`last_send_at`) <= last_send_at luôn cập nhật theo lần otp tạo mới nhất.
- **Lưu OTP an toàn**: Mã OTP phải được **băm (hash) bằng bcrypt** trước khi lưu vào cơ sở dữ liệu, không lưu OTP dạng văn bản thuần (plaintext).
- **Lưu mật khẩu mới an toàn**: Mật khẩu mới phải được **băm bằng bcrypt với 12 salt rounds** trước khi lưu vào cơ sở dữ liệu.
- **Ưu tiên kiểm tra trạng thái khóa tài khoản**: Phải kiểm tra `locked_until` **trước** khi kiểm tra thời gian chờ gửi lại OTP (cooldown) để tránh người dùng hoặc kẻ tấn công lợi dụng việc gửi OTP nhằm bỏ qua cơ chế khóa tài khoản.

**Quy mô / Phạm vi**:

- ~50 yêu cầu khôi phục mật khẩu/ngày (MVP)
- 3 API endpoints mới, 3 trang frontend mới
- Không migration mới (bảng `email_verifications` đã có từ UC04)

---

## 3. CONSTITUTION CHECK

### Layer 1 (Hard Rules) — ✅ PASS

| Rule | Status | Ghi chú |
|------|--------|---------|
| Không lưu password plaintext | ✅ | Hash bcrypt 12 rounds |
| Không SQL Injection | ✅ | Prisma parameterized queries |
| Không hard delete dữ liệu quan trọng | ✅ | Bảng `email_verifications` là bảng tạm, hard delete OTP (với type chuẩn) sau reset là đúng spec |
| Không leak credentials | ✅ | Response không chứa password_hash, otp_hash, OTP plaintext |
| Không lấy userId từ request body | ✅ | N/A — endpoint public, không cần auth |
| Không commit secrets | ✅ | SMTP credentials trong .env |
| Không lưu thông tin thẻ/ngân hàng | ✅ | N/A |
| Zod validation mọi input | ✅ | 3 Zod schemas cho 3 endpoint |
| JWT verify cho protected routes | ✅ | N/A — endpoint public |
| File upload validation | ✅ | N/A |

### Layer 2 (Architecture Constraints) — ✅ PASS

| Rule | Status | Ghi chú |
|------|--------|---------|
| Layered Architecture | ✅ | Route → Validator → Controller → Service → Repository |
| Cross-module access | ✅ | Chỉ trong Auth module của Member 1 |
| Module Ownership | ✅ | Không sửa code của member khác |
| DB transactions | ✅ | Prisma transaction cho bước reset password |
| Audit Log | ✅ | Pino log: OTP sent, OTP verified, password reset, lockout |

### Layer 3 (Engineering Standards) — ✅ TARGET

| Rule | Status | Ghi chú |
|------|--------|---------|
| Test coverage 80% services, 60% controllers | ✅ Target | Viết test sau khi implement |
| API response < target | ✅ Target | Theo bảng hiệu năng ở trên |
| ESLint 0 errors | ✅ Target | |
| Tests traceable về acceptance criteria | ✅ Target | Mapping SC-001 → SC-006 |
| API response format | ✅ | `{ success, data?, error? }` |

---

## 4. PROJECT STRUCTURE

### Tài liệu (thư mục feature)

```text
.sdd/CuongLH/UC07-feat-auth-forgot-password/
├── context.md           # Vấn đề, domain knowledge, stakeholders
├── spec.md              # Đặc tả EARS notation + User Stories
├── plan.md              # File này
├── research.md          # Phase 0: Quyết định kỹ thuật
├── data-model.md        # Phase 1: Schema DB + Entity
├── quickstart.md        # Phase 1: Hướng dẫn dev
├── contracts/
│   └── api-contracts.md # Phase 1: API request/response
└── tasks.md             # Phase 2: Danh sách task (sẽ tạo sau)
```

### Mã nguồn

```text
backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js          # [SỬA] Thêm 3 hàm controller
│   ├── services/
│   │   ├── auth.service.js             # [SỬA] Thêm 3 hàm business logic
│   │   ├── email.service.js            # [ĐÃ SỬA] Gọi sendResetPasswordEmail()
│   │   └── emailTemplates.utility.js   # [ĐÃ SỬA] Template buildResetPasswordOtpTemplate()
│   ├── repositories/
│   │   └── auth.repository.js          # [ĐÃ SỬA] Tập trung tất cả auth operations
│   ├── middlewares/
│   │   └── validators/
│   │       └── auth.validator.js       # [SỬA] Thêm 3 Zod schemas
│   ├── routes/
│   │   └── auth.routes.js              # [SỬA] Thêm 3 route POST
│   └── utils/
│       ├── otp.util.js                 # [DÙNG LẠI] generateOTP()
│       └── response.util.js            # [DÙNG LẠI] success()/error()
└── tests/
    └── integration/
        └── auth.forgot-password.test.js # [TẠO MỚI] Integration tests

frontend/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   └── auth/
│   │   │       └── ForgotPasswordPage.jsx   # [TẠO MỚI] Single-page 3-step với useState quản lý step
│   │   └── ui/
│   │       └── OTPInput.jsx                 # [DÙNG LẠI] Component nhập OTP 6 số
│   ├── services/
│   │   └── auth.service.js                  # [DÙNG LẠI] Thêm 3 phương thức API calls
│   └── hooks/
│       └── useCountdown.js                  # [DÙNG LẠI] Hook đếm ngược cooldown gửi lại OTP
└── tests/
    └── auth/
        └── ForgotPasswordPage.test.jsx      # [TẠO MỚI] Unit test cho cả 3 step
```

---

## 5. COMPLEXITY TRACKING

Không có vi phạm constitution nào. Bảng này để trống.

| Vi phạm | Lý do | Biện minh |
|---------|-------|-----------|
| — | — | — |

---

## 6. IMPLEMENTATION PHASES

### Phase 0: Research & Verification (ĐÃ HOÀN THÀNH)

**Mục tiêu**: Khảo sát codebase, xác định dependencies, quyết định kỹ thuật.

**Output**: `research.md` (đã có)

- R1: Sử dụng `crypto.randomInt()` để tạo mã OTP ngẫu nhiên, đảm bảo an toàn về mặt bảo mật.
- R2: Sử dụng chung bảng `email_verifications` với UC04 và phân biệt mục đích bằng trường `type` (Type Discriminator).
- R3: Chống dò tìm tài khoản (Zero User Enumeration) bằng cách luôn tạo luồng xử lý giống nhau (fake OTP nếu cần) và trả về cùng một thông báo phản hồi, bất kể email có tồn tại hay không.
- R4: Thông tin khóa tạm thời (Lockout) được lưu ngay trong bản ghi OTP, không tạo bảng riêng.
- R5: Xóa hoàn toàn (Hard DELETE) bản ghi OTP sau khi đặt lại mật khẩu thành công; khi tạo OTP mới sẽ cập nhật hoặc tạo mới bản ghi (Upsert).
- R6: Gửi email theo cơ chế bất đồng bộ (Asynchronous), nếu gửi thất bại thì ghi log và không trả lỗi cho người dùng.
- R7: Frontend quản lý trạng thái bằng `useState` local trong parent component (single-page stepper), KHÔNG persist state qua refresh (theo EC5 của spec).

**Kết quả**: Tất cả quyết định đã chốt, không còn câu hỏi mở.

---

### Phase 1: Design & Contracts (ĐÃ HOÀN THÀNH)

**Mục tiêu**: Thiết kế data model, API contracts, quickstart.

**Output**:

- `data-model.md` (đã có) — Schema `email_verifications`, relationships, state transitions, query patterns
- `contracts/api-contracts.md` (đã có) — 3 endpoint specs: request/response format, business logic, error codes, Zod schemas
- `quickstart.md` (đã có) — Hướng dẫn cài đặt, file structure, curl test commands

**Kết quả**: Design đã hoàn chỉnh, sẵn sàng cho implementation.

---

### Phase 2: Implementation Planning (HIỆN TẠI)

**Mục tiêu**: Chi tiết hóa các task triển khai.

**Output sẽ tạo**: `tasks.md` (bằng lệnh `/speckit-tasks` sau khi plan được duyệt)

**Phác thảo các nhóm task**:

| Nhóm | Nội dung | Ước tính |
|------|----------|----------|
| Setup | Kiểm tra Prisma schema, SMTP config | 0.5h |
| Backend Core | 3 service methods + email template | 1.5h |
| Backend API | Validator + Controller + Routes | 0.5h |
| Frontend Page | ForgotPasswordPage.jsx (stepper 3-step) + OTPInput reuse | 2h |
| API Integration | auth.service.js + wire up | 0.5h |
| Testing | Backend integration + Frontend unit tests | 1.5h |
| Polish | Swagger docs update | 0.5h |

**Thứ tự thực hiện**:

```text
Setup → Backend Core → Backend API ──┐
                                      ├──→ Testing → Polish
         Frontend Page ────┘
              (có thể chạy song song)
```

---

## 7. RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SMTP service down | Cao — User không nhận được OTP | Trung bình | Lỗi im lặng + log, user thử lại sau cooldown |
| Email vào spam | Cao — User không thấy OTP | Trung bình | Dùng SMTP uy tín (Gmail), chủ đề rõ ràng |
| Timing attack lộ email | Cao — Lộ thông tin tài khoản | Thấp | Fake OTP + chuẩn hóa response time |
| Brute-force OTP | Cao — Chiếm tài khoản | Thấp (đã giảm) | Lockout 5 lần/15 phút + OTP TTL 10 phút |
| Race condition tạo OTP | Trung bình — Trùng lặp OTP | Thấp | UNIQUE(email, type) + upsert atomic |
| Mất state frontend | Trung bình — User mất context | Trung bình | KHÔNG persist state, user thực hiện lại từ Step 1 (theo EC5 spec) |
| Transaction fail | Trung bình — Password đổi nhưng OTP chưa xóa | Thấp | Prisma transaction atomic |
| Bypass khóa | Cao — Reset lockout bằng request OTP mới | Trung bình | Check locked_until TRƯỚC cooldown |

---

## 8. SUCCESS CRITERIA REVIEW

Map từ spec.md §Success Criteria sang implementation deliverables (Các hạng mục triển khai):

| ID | Tiêu chí thành công | Cách kiểm tra |
|----|---------------------|---------------|
| SC-001 | Người dùng hoàn tất toàn bộ quy trình khôi phục mật khẩu trong dưới 3 phút | Kiểm thử thủ công toàn bộ quy trình (End-to-End) |
| SC-002 | Hệ thống xử lý ổn định 100 yêu cầu đồng thời (Concurrent Requests) | Chưa triển khai trong giai đoạn này |
| SC-003 | Tỷ lệ gửi email OTP thành công đạt trên 97% | Theo dõi log và thống kê lỗi từ SMTP |
| SC-004 | Không thể xác định email có tồn tại hay không thông qua phản hồi của hệ thống | Kiểm thử tích hợp: So sánh nội dung và thời gian phản hồi giữa email tồn tại và không tồn tại |
| SC-005 | Không thể brute-force mã OTP trong thời gian hiệu lực | Kiểm thử logic: Nhập sai 5 lần → khóa 15 phút, tối đa 5 lần thử trong mỗi 15 phút |
| SC-006 | Ít nhất 95% người dùng hoàn tất quy trình khôi phục mật khẩu ngay từ lần đầu | Theo dõi số liệu thực tế sau khi triển khai (Analytics) |

---

## 9. DEPLOYMENT CHECKLIST

Trước khi merge vào `main`:

- [ ] Tất cả unit tests pass (`npm test`)
- [ ] Tất cả integration tests pass
- [ ] ESLint 0 errors (`npm run lint`)
- [ ] Swagger docs cập nhật (3 endpoint mới)
- [ ] Code review bởi ít nhất 1 thành viên khác
- [ ] Constitution check re-verify (Layer 1/2/3 đều PASS)
- [ ] SMTP credentials có trong `.env` production
- [ ] Không commit secrets, `.env` trong `.gitignore`
- [ ] Không còn TODO/FIXME trong code

---

## 10. NEXT STEPS

Sau khi plan này được duyệt:

1. Chạy `/speckit-tasks` để sinh `tasks.md` chi tiết
2. Implement theo thứ tự: Backend Core → Backend API → Frontend
3. Viết integration tests song song với implementation
4. Cập nhật Swagger docs
5. Cập nhật `share_context.md`
6. Tạo PR: branch `feat/UC07-forgot-password` → `CuongLH`
7. Code review → Merge

---

## 11. QUESTIONS FOR STAKEHOLDERS

| # | Câu hỏi | Lựa chọn | Khuyến nghị |
|---|---------|----------|-------------|
| Q1 | Email OTP nên dùng plaintext hay HTML template? | A: Plaintext / B: HTML đơn giản | **B** |
| Q2 | Có cần validate mật khẩu mới khác mật khẩu cũ không? | A: Không (theo spec) / B: Có | **A** (spec đã nói Out of Scope) |
| Q3 | Sau reset có tự động login không? | A: Không (theo spec) / B: Có | **A** (bảo mật: user xác nhận pass mới hoạt động) |
| Q4 | Có cần IP-based rate limiting không? | A: Chỉ email-based / B: Thêm IP-based | **A** cho MVP |
| Q5 | Cleanup OTP hết hạn bằng cách nào? | A: Lazy delete khi tạo OTP mới / B: Cron job / C: MySQL Event Scheduler | **A** cho MVP (đơn giản nhất) |

---

## 12. ESTIMATED EFFORT

**Tổng**: **~7 giờ**

| Hạng mục | Thời gian ước tính | Ghi chú |
|----------|--------------------|----------|
| Backend Core (`auth.service.js` + `email.service.js` + `emailTemplates.utility.js` + `auth.repository.js`) | 1.5 giờ | Triển khai 3 phương thức nghiệp vụ (Service Methods), mẫu email (Email Template), và sequential updatePassword + deleteVerification |
| Backend API (Validator + Controller + Routes) | 0.5 giờ | Xây dựng Zod Validation Schema và Controller theo mô hình Thin Controller |
| Frontend Page (`ForgotPasswordPage.jsx`) | 2 giờ | Single-page 3-step với `useState` local, KI tra dữ liệu đầu vào, bộ đếm thời gian (Timer), OTPInput reuse |
| API Integration (`auth.service.js` + wire up) | 0.5 giờ | Gọi API bằng Axios và xử lý các trường hợp lỗi |
| Kiểm thử (Backend Integration + Frontend Unit) | 1.5 giờ | Kiểm thử trường hợp thành công, các trường hợp lỗi và các trường hợp đặc biệt (Edge Cases) |
| Tài liệu (Swagger) | 0.5 giờ | Viết chú thích JSDoc và cập nhật tài liệu API |
| Thời gian dự phòng (Buffer) | 0.25 giờ | Dành cho việc sửa lỗi và xử lý các vấn đề phát sinh ngoài dự kiến |

---

## 13. PRIORITY

**P1 — Core Feature**

Tính năng này thuộc nhóm Authentication (UC07), là chức năng cốt lõi cho phép người dùng lấy lại quyền truy cập tài khoản. Không có tính năng này, người dùng quên mật khẩu sẽ bị khóa vĩnh viễn khỏi hệ thống.

Phụ thuộc vào:

- UC04 (Register) — bảng `email_verifications` đã có
- UC03 (Login) — để user đăng nhập sau khi reset
- MD15 (Email Service) — NodeMailer config

---

**Người phê duyệt**: CuongLH  **Ngày**: 08/07/2026
