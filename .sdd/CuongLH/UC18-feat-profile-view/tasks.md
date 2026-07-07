# Tác Vụ: Xem Hồ Sơ Cá Nhân (View Profile) — UC18

**Đầu Vào**: Tài liệu thiết kế từ `.sdd/CuongLH/UC18-feat-profile-view/`

**Điều Kiện Tiên Quyết**: plan.md (bắt buộc), spec.md (bắt buộc — cho User Stories), research.md, data-model.md, contracts/

**Kiểm Thử**: Các tác vụ bên dưới BAO GỒM kiểm thử. Kiểm thử là BẮT BUỘC cho tính năng này (yêu cầu ≥80% coverage cho Service layer — AGENTS.md Section 7).

**Tổ Chức**: Tác vụ được nhóm theo User Story để cho phép triển khai và kiểm thử độc lập từng story.

---

## Định Dạng: `[Mã] [P?] [Story] Mô Tả`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc lẫn nhau)
- **[Story]**: User Story mà tác vụ này thuộc về (US1, US2, US3, US4)
- Mô tả bao gồm đường dẫn file chính xác

## Quy Ước Đường Dẫn

Dự án này sử dụng cấu trúc **Web Application**:

- `backend/src/` — Mã nguồn Backend (Express + Prisma)
- `backend/tests/` — Kiểm thử Backend
- `frontend/src/` — Mã nguồn Frontend (React)
- `frontend/tests/` — Kiểm thử Frontend

---

## Phase 1: Thiết Lập (Setup)

**Mục Đích**: Khởi tạo Prisma và cấu trúc dự án nền tảng

- [ ] T001 Khởi tạo Prisma trong `backend/` bằng lệnh `npx prisma init` trong `backend/`
- [ ] T002 [P] Tạo file `backend/prisma/schema.prisma` với định nghĩa models User, Skill, UserSkill, Role từ data-model.md
- [ ] T003 [P] Cấu hình biến môi trường `DATABASE_URL` trong `backend/.env` trỏ đến MySQL database

---

## Phase 2: Nền Tảng (Foundational)

**Mục Đích**: Hạ tầng cốt lõi PHẢI hoàn thành TRƯỚC KHI bất kỳ User Story nào có thể được triển khai

**⚠️ NGHIÊM TRỌNG**: Không User Story nào được bắt đầu cho đến khi Phase này hoàn tất

- [ ] T004 Tạo Prisma migration đầu tiên bằng `npx prisma migrate dev --name init` và sinh Prisma Client bằng `npx prisma generate` trong `backend/`
- [ ] T005 Triển khai ProfileRepository: phương thức `findUserWithSkills(userId)` trong `backend/src/repositories/profile.repository.js`

**Điểm Kiểm Tra (Checkpoint)**: Nền tảng đã sẵn sàng — có thể bắt đầu triển khai các User Story

---

## Phase 3: User Story 1 — Xem Thông Tin Cá Nhân Thành Công (Priority: P1) 🎯 MVP

**Mục Tiêu**: Người dùng đã đăng nhập gọi `GET /api/v1/user/me` và nhận về đầy đủ thông tin hồ sơ cá nhân (họ tên, email, số điện thoại, ảnh đại diện) kèm danh sách kỹ năng đã đăng ký, response đã được làm sạch (loại bỏ password_hash và các trường nhạy cảm khác).

**Kiểm Thử Độc Lập**: Gọi API với JWT token hợp lệ của một user có ít nhất 1 kỹ năng → Xác minh HTTP 200, response chứa đúng các trường `full_name`, `email`, `phone_number`, `avatar_url`, và mảng `skills` với cấu trúc `[{ skill_id, skill_name }]`. Xác minh response KHÔNG chứa `password_hash`, `role_id`, `is_active`.

### Kiểm Thử cho User Story 1 (VIẾT TRƯỚC, ĐẢM BẢO THẤT BẠI trước khi triển khai)

- [ ] T006 [P] [US1] Viết unit test cho ProfileService — happy path (user tồn tại, có skills) trong `backend/tests/unit/profile.service.test.js`
- [ ] T007 [P] [US1] Viết unit test cho ProfileRepository — `findUserWithSkills()` trả về đúng dữ liệu trong `backend/tests/unit/profile.repository.test.js`

### Triển Khai cho User Story 1

- [ ] T008 [US1] Triển khai ProfileService: phương thức `getUserProfile(userId)` với data sanitization trong `backend/src/services/profile.service.js` (phụ thuộc T005)
- [ ] T009 [US1] Triển khai ProfileController: xử lý `GET /api/v1/user/me`, lấy `userId` từ `req.user` (JWT đã xác thực), gọi ProfileService trong `backend/src/controllers/profile.controller.js` (phụ thuộc T008)
- [ ] T010 [US1] Cập nhật `backend/src/routes/user.routes.js`: thêm route `GET /me` với auth middleware `authenticate` trỏ đến ProfileController (phụ thuộc T009)
- [ ] T011 [US1] Triển khai trang ProfilePage và API client trong `frontend/src/components/pages/ProfilePage.jsx` và `frontend/src/api/profileApi.js` (phụ thuộc T010)

**Điểm Kiểm Tra (Checkpoint)**: User Story 1 hoàn chỉnh — API `GET /api/v1/user/me` hoạt động với happy path, trả về đúng dữ liệu đã sanitize. Frontend hiển thị được thông tin hồ sơ.

---

## Phase 4: User Story 2 — Xử Lý Request Không Có JWT Token Hợp Lệ (Priority: P1)

**Mục Tiêu**: Hệ thống từ chối truy cập với HTTP 401 khi người dùng chưa đăng nhập (không có JWT token) hoặc token không hợp lệ/đã hết hạn.

**Kiểm Thử Độc Lập**: Gọi API không kèm cookie token → Xác minh HTTP 401 UNAUTHORIZED. Gọi API với token đã hết hạn → Xác minh HTTP 401 TOKEN_INVALID.

### Kiểm Thử cho User Story 2

- [ ] T012 [P] [US2] Viết integration test cho các kịch bản auth lỗi (không token, token hết hạn, token giả mạo) trong `backend/tests/integration/profile.test.js` (phụ thuộc T010)

**Ghi Chú**: Auth Middleware đã có sẵn (`backend/src/middleware/auth.middleware.js`). User Story này chủ yếu là kiểm thử để xác nhận middleware hoạt động đúng, không cần code mới. Nếu phát hiện lỗi trong auth middleware, cần báo cáo riêng.

**Điểm Kiểm Tra (Checkpoint)**: Auth error handling hoạt động — 100% request không có token hợp lệ bị từ chối với HTTP 401.

---

## Phase 5: User Story 3 — Xử Lý Tài Khoản Không Tồn Tại Hoặc Đã Bị Vô Hiệu Hóa (Priority: P2)

**Mục Tiêu**: JWT token hợp lệ nhưng tài khoản không tồn tại trong database → HTTP 404 USER_NOT_FOUND. Tài khoản có `is_active = false` → HTTP 403 ACCOUNT_DISABLED.

**Kiểm Thử Độc Lập**: Tạo JWT token hợp lệ cho user_id không tồn tại → Xác minh HTTP 404. Set `is_active = false` cho user trong database → Gọi API → Xác minh HTTP 403.

### Kiểm Thử cho User Story 3

- [ ] T013 [P] [US3] Viết unit test cho ProfileService — user không tồn tại (throw USER_NOT_FOUND) và user bị vô hiệu hóa (throw ACCOUNT_DISABLED) trong `backend/tests/unit/profile.service.test.js`
- [ ] T014 [P] [US3] Viết integration test cho endpoint — HTTP 404 USER_NOT_FOUND và HTTP 403 ACCOUNT_DISABLED trong `backend/tests/integration/profile.test.js` (phụ thuộc T010)

**Ghi Chú**: Logic `USER_NOT_FOUND` và `ACCOUNT_DISABLED` đã được implement trong T008 (ProfileService). Các tác vụ ở Phase này chỉ là kiểm thử bổ sung.

**Điểm Kiểm Tra (Checkpoint)**: Edge case handling hoạt động — tài khoản không tồn tại trả về 404, tài khoản bị vô hiệu hóa trả về 403.

---

## Phase 6: User Story 4 — Xem Profile Khi Chưa Có Kỹ Năng Nào (Priority: P3)

**Mục Tiêu**: Người dùng mới chưa đăng ký kỹ năng nào vẫn xem được profile thành công, mảng `skills` trả về `[]` (rỗng) thay vì `null` hoặc gây lỗi.

**Kiểm Thử Độc Lập**: Gọi API với tài khoản không có bản ghi nào trong bảng `user_skills` → Xác minh HTTP 200 và `skills: []`.

### Kiểm Thử cho User Story 4

- [ ] T015 [P] [US4] Viết unit test cho ProfileService — user không có kỹ năng (skills = []) trong `backend/tests/unit/profile.service.test.js`

**Ghi Chú**: Logic xử lý `skills: []` đã có trong T008 (ProfileService). Tác vụ này chỉ là kiểm thử bổ sung.

**Điểm Kiểm Tra (Checkpoint)**: Edge case empty skills hoạt động — user không có kỹ năng trả về 200 với `skills: []`.

---

## Phase 7: Hoàn Thiện & Đóng Gói (Polish & Cross-Cutting Concerns)

**Mục Đích**: Các cải tiến ảnh hưởng đến nhiều User Story

- [ ] T016 Viết tài liệu Swagger JSDoc cho endpoint `GET /api/v1/user/me` trong `backend/src/routes/user.routes.js` (đúng phạm vi routes — tuân thủ Lesson 5)
- [ ] T017 [P] Kiểm thử tải (load test) với artillery: xác nhận response time < 1s với 200 concurrent requests (SC-001, SC-005)
- [ ] T018 [P] Chạy `npm run lint` để kiểm tra không có lỗi ESLint trên toàn bộ code mới
- [ ] T019 Kiểm tra lần cuối: chạy toàn bộ unit tests + integration tests, xác nhận coverage ≥ 80% cho Service layer
- [ ] T020 Xác thực theo quickstart.md: chạy lại tất cả curl examples và Postman scenarios để đảm bảo API hoạt động đúng như tài liệu

---

## Phụ Thuộc & Thứ Tự Thực Hiện

### Phụ Thuộc Giữa Các Phase

- **Setup (Phase 1)**: Không phụ thuộc — có thể bắt đầu ngay lập tức
- **Nền Tảng (Phase 2)**: Phụ thuộc vào Setup hoàn thành — CHẶN tất cả các User Story
- **User Stories (Phase 3–6)**: Tất cả phụ thuộc vào Phase Nền Tảng hoàn thành
  - User Story 1 (P1): Bắt đầu sau Phase 2 — không phụ thuộc story khác
  - User Story 2 (P1): Bắt đầu sau T010 (Route sẵn sàng) — không phụ thuộc story khác
  - User Story 3 (P2): Bắt đầu sau khi T008 hoàn thành (Service có sẵn logic error)
  - User Story 4 (P3): Bắt đầu sau khi T008 hoàn thành (Service có sẵn logic empty skills)
- **Hoàn Thiện (Phase 7)**: Phụ thuộc vào tất cả User Story mong muốn đã hoàn thành

### Phụ Thuộc Trong Từng User Story

- Kiểm thử PHẢI được viết trước và THẤT BẠI trước khi triển khai (TDD)
- Repository trước Service
- Service trước Controller
- Controller trước Routes
- Backend hoàn chỉnh trước Frontend
- Story hoàn thành trước khi chuyển sang story tiếp theo

### Cơ Hội Chạy Song Song

- T002 và T003 có thể chạy song song (khác file, không phụ thuộc)
- T006 và T007 có thể chạy song song (cùng viết tests, khác file)
- T013, T014, T015 có thể chạy song song (cùng Phase test bổ sung, khác file)
- T017 và T018 có thể chạy song song trong Phase 7
- US2, US3, US4 có thể chạy song song sau khi US1 hoàn thành (nếu có nhiều người)

---

## Chiến Lược Triển Khai

### MVP Trước (Chỉ User Story 1)

1. Hoàn thành Phase 1: Setup
2. Hoàn thành Phase 2: Nền Tảng (NGHIÊM TRỌNG — chặn tất cả stories)
3. Hoàn thành Phase 3: User Story 1
4. **DỪNG và XÁC THỰC**: Kiểm thử User Story 1 độc lập
5. Deploy/demo nếu sẵn sàng

### Phân Phối Tăng Dần

1. Setup + Nền Tảng hoàn thành → Nền tảng sẵn sàng
2. Thêm User Story 1 → Kiểm thử độc lập → Deploy/Demo (MVP!)
3. Thêm User Story 2 → Kiểm thử độc lập → Deploy/Demo
4. Thêm User Story 3 → Kiểm thử độc lập → Deploy/Demo
5. Thêm User Story 4 → Kiểm thử độc lập → Deploy/Demo
6. Mỗi story bổ sung giá trị mà không phá vỡ story trước đó

### Chiến Lược Nhóm Song Song (nếu có nhiều lập trình viên)

1. Cả nhóm cùng hoàn thành Setup + Nền Tảng
2. Khi Nền Tảng đã xong:
   - Lập trình viên A: User Story 1 (P1) — Backend happy path
   - Lập trình viên B: User Story 2 (P1) — Auth error tests
   - Lập trình viên C: User Story 3 + 4 (P2 + P3) — Edge case tests
3. Các story hoàn thành và tích hợp độc lập

---

## Ghi Chú

- Tác vụ [P] = khác file, không phụ thuộc lẫn nhau
- Nhãn [Story] ánh xạ tác vụ đến User Story cụ thể để truy vết
- Mỗi User Story phải có thể hoàn thành và kiểm thử độc lập
- Xác minh tests thất bại TRƯỚC KHI triển khai (TDD)
- Commit sau mỗi tác vụ hoặc nhóm tác vụ logic
- Dừng tại bất kỳ checkpoint nào để xác thực story độc lập
- Tránh: tác vụ mơ hồ, xung đột cùng file, phụ thuộc chéo giữa các story làm mất tính độc lập
- Thời gian tối đa mỗi tác vụ: **4 giờ**. Tác vụ lớn hơn PHẢI chia nhỏ thành sub-tasks
- TUYỆT ĐỐI KHÔNG để lại comments dạng `TODO` hoặc `FIXME` trong code chuẩn bị merge

---

**Trạng Thái Tài Liệu**: SẴN SÀNG TRIỂN KHAI  
**Người Phụ Trách**: Member 1 — CuongLH  
**Module**: Profile Management  
**Tổng Tác Vụ**: 20 tác vụ (T001–T020)  
**Thời Gian Dự Kiến**: 19–27 giờ (1 lập trình viên)
