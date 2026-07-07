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
| US4 | Chống dò quét tài khoản (zero user enumeration) | P1 |

**Hướng tiếp cận kỹ thuật (từ research.md)**:

| Quyết định | Lựa chọn | Lý do |
|------------|----------|------|
| Sinh OTP | `crypto.randomInt(100000, 999999)` | An toàn, không bias |
| Lưu OTP | Bảng `email_verifications` dùng chung, phân biệt bằng cột `type` | Tránh trùng lặp code với UC04 |
| Hash OTP | bcrypt (cùng salt rounds với password) | Bảo mật, đồng nhất |
| Chống enumeration | Luôn trả về success + fake OTP cho email không tồn tại | Ngăn timing attack |
| Gửi email | Async fire-and-forget, lỗi im lặng | Không block API, không lộ thông tin |
| Frontend state | React Context + sessionStorage | Chia sẻ state giữa 3 trang, sống qua refresh |

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
| POST /forgot-password/request | < 2s (gồm thời gian gửi email async) |
| POST /forgot-password/verify-otp | < 500ms |
| POST /forgot-password/reset | < 1s |
| Concurrent requests | 100 requests không lỗi/timeout |

**Ràng buộc**:

- Zero user enumeration: response message + timing giống nhau cho email tồn tại/không tồn tại (variance < 100ms)
- Cooldown gửi OTP: 60 giây (tính từ `last_sent_at`)
- Lockout: 5 lần sai → khóa 15 phút (`is_locked` + `locked_until`)
- OTP TTL: 10 phút (tính từ `created_at`)
- OTP phải hash bcrypt trước khi lưu DB
- Mật khẩu mới hash bcrypt 12 rounds
- Kiểm tra `locked_until` TRƯỚC khi kiểm tra cooldown (ngăn bypass khóa)

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
│   │   └── email.service.js            # [SỬA] Thêm sendResetPasswordOTP()
│   ├── repositories/
│   │   ├── user.repository.js          # [DÙNG LẠI] findByEmail, updatePassword
│   │   └── otp.repository.js           # [DÙNG LẠI] CRUD email_verifications
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
│   ├── pages/
│   │   └── auth/
│   │       ├── ForgotPasswordStep1.jsx   # [TẠO MỚI] Nhập email
│   │       ├── ForgotPasswordStep2.jsx   # [TẠO MỚI] Nhập OTP
│   │       └── ForgotPasswordStep3.jsx   # [TẠO MỚI] Nhập mật khẩu mới
│   ├── components/
│   │   └── auth/
│   │       └── OTPInput.jsx              # [DÙNG LẠI] Component nhập OTP 6 số
│   ├── contexts/
│   │   └── ForgotPasswordContext.jsx     # [TẠO MỚI] State management
│   ├── services/
│   │   └── authApi.js                    # [SỬA] Thêm 3 API calls
│   └── hooks/
│       └── useMultiStepForm.js           # [DÙNG LẠI] Hook multi-step
└── tests/
    └── auth/
        ├── ForgotPasswordStep1.test.jsx  # [TẠO MỚI]
        ├── ForgotPasswordStep2.test.jsx  # [TẠO MỚI]
        └── ForgotPasswordStep3.test.jsx  # [TẠO MỚI]
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

- R1: Dùng `crypto.randomInt()` để sinh OTP
- R2: Bảng `email_verifications` dùng chung với UC04 (type discriminator)
- R3: Zero user enumeration: fake OTP + response giống nhau
- R4: Lockout lưu trong cùng record OTP
- R5: Hard DELETE OTP sau reset thành công, upsert khi tạo OTP mới
- R6: Gửi email async, lỗi im lặng
- R7: Frontend state: React Context + sessionStorage

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
| Frontend Context | ForgotPasswordContext.jsx | 0.25h |
| Frontend Pages | 3 Step components + OTPInput reuse | 2h |
| API Integration | authApi.js + wire up | 0.5h |
| Testing | Backend integration + Frontend unit tests | 1.5h |
| Polish | Swagger docs, share_context.md update | 0.5h |

**Thứ tự thực hiện**:

```text
Setup → Backend Core → Backend API ──┐
                                      ├──→ Testing → Polish
         Frontend Context → Pages ────┘
              (có thể chạy song song)
```

---

## 7. RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SMTP service down | Cao — User không nhận được OTP | Trung bình | Lỗi im lặng + log, user thử lại sau cooldown |
| Email vào spam | Cao — User không thấy OTP | Trung bình | Dùng SMTP uy tín (Gmail), subject rõ ràng |
| Timing attack lộ email | Cao — Lộ thông tin tài khoản | Thấp | Fake OTP + chuẩn hóa response time |
| Brute-force OTP | Cao — Chiếm tài khoản | Thấp (đã giảm) | Lockout 5 lần/15 phút + OTP TTL 10 phút |
| Race condition tạo OTP | Trung bình — Trùng lặp OTP | Thấp | UNIQUE(email, type) + upsert atomic |
| Mất state frontend | Trung bình — User mất context | Trung bình | sessionStorage persistence |
| Transaction fail | Trung bình — Password đổi nhưng OTP chưa xóa | Thấp | Prisma transaction atomic |
| Bypass khóa | Cao — Reset lockout bằng request OTP mới | Trung bình | Check locked_until TRƯỚC cooldown |

---

## 8. SUCCESS CRITERIA REVIEW

Map từ spec.md §Success Criteria sang implementation deliverables:

| ID | Criteria | Cách kiểm tra |
|----|----------|---------------|
| SC-001 | Hoàn tất flow < 3 phút | Manual test end-to-end |
| SC-002 | Xử lý 100 concurrent requests | Load test (k6 hoặc artillery) |
| SC-003 | Gửi email OTP thành công > 99% | Monitor log SMTP errors |
| SC-004 | Không phân biệt được email tồn tại/không | Integration test: so sánh response body + timing |
| SC-005 | Không thể brute-force OTP trong 10 phút | Logic test: 5 lần sai = khóa 15 phút, chỉ 5 attempt/15 phút |
| SC-006 | 95% user hoàn tất lần đầu | Analytics sau deploy (không test được trước) |

---

## 9. DEPLOYMENT CHECKLIST

Trước khi merge vào `main`:

- [ ] Tất cả unit tests pass (`npm test`)
- [ ] Tất cả integration tests pass
- [ ] ESLint 0 errors (`npm run lint`)
- [ ] Swagger docs cập nhật (3 endpoint mới)
- [ ] `share_context.md` cập nhật API contracts
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
| Q1 | Email OTP nên dùng plaintext hay HTML template? | A: Plaintext / B: HTML đơn giản | **A** cho MVP |
| Q2 | Có cần validate mật khẩu mới khác mật khẩu cũ không? | A: Không (theo spec) / B: Có | **A** (spec đã nói Out of Scope) |
| Q3 | Sau reset có tự động login không? | A: Không (theo spec) / B: Có | **A** (bảo mật: user xác nhận pass mới hoạt động) |
| Q4 | Có cần IP-based rate limiting không? | A: Chỉ email-based / B: Thêm IP-based | **A** cho MVP |
| Q5 | Cleanup OTP hết hạn bằng cách nào? | A: Lazy delete khi tạo OTP mới / B: Cron job / C: MySQL Event Scheduler | **A** cho MVP (đơn giản nhất) |

---

## 12. ESTIMATED EFFORT

**Tổng**: **~7 giờ**

| Phần | Giờ | Ghi chú |
|------|-----|---------|
| Backend Core (auth.service.js + email.service.js + otp.repository.js) | 1.5h | 3 service methods + email template |
| Backend API (validator + controller + routes) | 0.5h | Zod schemas + thin controllers |
| Frontend Context (ForgotPasswordContext.jsx) | 0.25h | Context + sessionStorage |
| Frontend Pages (3 Step components) | 2h | Form UI + validation + timer |
| API Integration (authApi.js + wire up) | 0.5h | Axios calls + error handling |
| Testing (backend integration + frontend unit) | 1.5h | Happy path + error cases + edge cases |
| Documentation (Swagger + share_context) | 0.5h | JSDoc comments + API docs |
| Buffer | 0.25h | Debug, unexpected issues |

---

## 13. PRIORITY

**P1 — Core Feature**

Tính năng này thuộc nhóm Authentication (UC07), là chức năng cốt lõi cho phép người dùng lấy lại quyền truy cập tài khoản. Không có tính năng này, người dùng quên mật khẩu sẽ bị khóa vĩnh viễn khỏi hệ thống.

Phụ thuộc vào:

- UC04 (Register) — bảng `email_verifications` đã có
- UC03 (Login) — để user đăng nhập sau khi reset
- MD15 (Email Service) — NodeMailer config

---

**Người phê duyệt**: ________________  **Ngày**: ________________
