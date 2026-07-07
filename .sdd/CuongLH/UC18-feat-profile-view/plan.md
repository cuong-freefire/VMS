# Kế Hoạch Triển Khai: Xem Hồ Sơ Cá Nhân (View Profile)

**Nhánh**: `feat/UC18-view-profile` | **Ngày**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Đầu Vào**: Đặc tả tính năng từ `.sdd/CuongLH/UC18-feat-profile-view/spec.md`

---

## 1. Tổng Quan (Summary)

Tính năng cung cấp API endpoint cho phép người dùng đã đăng nhập xem thông tin hồ sơ cá nhân của chính mình (Private Profile). API trả về các thông tin cơ bản (họ tên, email, số điện thoại, ảnh đại diện) kèm theo danh sách kỹ năng đã đăng ký. Đồng thời đảm bảo an toàn bảo mật bằng cách loại bỏ triệt để các trường dữ liệu nhạy cảm (password_hash, token, internal IDs) khỏi response.

**Hướng Tiếp Cận Kỹ Thuật (Technical Approach)**:

- Sử dụng Auth Middleware hiện có để xác thực JWT token và trích xuất định danh người dùng từ `req.user` (không nhận từ request body/params - tuân thủ Lesson 3).
- Xây dựng Service layer để xử lý business logic truy vấn database qua Prisma ORM.
- Xây dựng Repository layer để tách biệt hoàn toàn data access logic khỏi business logic.
- Áp dụng data sanitization để loại bỏ mọi trường nhạy cảm trước khi trả về client.
- Tuân thủ nghiêm ngặt kiến trúc phân tầng: **Controller → Service → Repository**.

---

## 2. Bối Cảnh Kỹ Thuật (Technical Context)

**Ngôn Ngữ / Phiên Bản**: Node.js 18+ + JavaScript (ESM)

**Các Thư Viện Phụ Thuộc Chính (Primary Dependencies)**:

| Thư Viện | Vai Trò | Trạng Thái |
|----------|--------|------------|
| Express 5.x | REST API framework | Đã có |
| Prisma ORM | Database access | **CẦN THIẾT LẬP MỚI** |
| MySQL | Database | Đã có |
| Zod | Input validation | Đã có |
| JWT + bcryptjs | Authentication | Đã có |
| Pino | Logging | Đã có |

**Lưu Trữ (Storage)**: MySQL với các bảng liên quan:

- `users` — thông tin tài khoản người dùng
- `user_skills` — bảng trung gian many-to-many giữa User và Skill
- `skills` — danh mục kỹ năng

**Kiểm Thử (Testing)**: Jest + Supertest cho integration tests

**Nền Tảng Mục Tiêu (Target Platform)**: Node.js server runtime

**Loại Dự Án (Project Type)**: Web application (RESTful API backend + React frontend)

**Mục Tiêu Hiệu Năng (Performance Goals)**:

- Thời gian phản hồi (response time) < 300ms ở tải bình thường
- Thời gian phản hồi < 1s với 200 concurrent requests
- Hỗ trợ tối thiểu 200+ người dùng đồng thời

**Ràng Buộc (Constraints)**:

- **PHẢI** thực thi JWT authentication qua httpOnly cookie (ADR-002)
- **PHẢI** sanitize tất cả các trường nhạy cảm khỏi response (DATABASE.md Section 12)
- **PHẢI** sử dụng định danh người dùng từ JWT token, KHÔNG từ request params/body (Lesson 3)
- **PHẢI** tuân thủ kiến trúc phân tầng Controller → Service → Repository (ADR-001)
- **PHẢI** sử dụng định dạng response chuẩn: `{ success, message, data }` (ADR-006)

**Quy Mô / Phạm Vi (Scale/Scope)**:

- Một API endpoint duy nhất: `GET /api/v1/user/me`
- Dự kiến ~10k người dùng hoạt động
- Thao tác chỉ đọc (read-only), không thay đổi dữ liệu

---

## 3. Kiểm Tra Tuân Thủ Hiến Pháp (Constitution Check)

*CỔNG KIỂM TRA: Phải vượt qua trước khi thực hiện Phase 0. Kiểm tra lại sau Phase 1.*

### Tuân Thủ Kiến Trúc (Architecture Compliance)

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| Kiến trúc phân tầng: Controller → Service → Repository | ✅ Đạt | AGENTS.md Section 6 |
| Module ownership: Member 1 (CuongLH) sở hữu Profile Management | ✅ Đạt | CLAUDE.md Section 1 |
| Cross-module: Không gọi Repository của module khác | ✅ Đạt | AGENTS.md Section 5 |
| Định dạng response: Sử dụng `response.util.js` | ✅ Đạt | ADR-006 |
| Authentication: JWT HttpOnly Cookie | ✅ Đạt | ADR-002 |
| Database access: Chỉ dùng Prisma ORM | ✅ Đạt | ADR-001 |
| Validation: Zod cho input validation | ✅ Đạt | ADR-003 |

### Tuân Thủ Bảo Mật (Security Compliance)

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| UserId lấy từ JWT token, KHÔNG từ request body | ✅ Đạt | Lesson 3 |
| Data sanitization: Loại bỏ password_hash, tokens khỏi response | ✅ Đạt | DATABASE.md Section 12 |
| Soft delete: Query phải lọc `is_active = true` | ✅ Đạt | ADR-005 |

### Tuân Thủ Chất Lượng Code (Code Quality)

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| Độ dài hàm tối đa: 40 dòng | ✅ Đạt | AGENTS.md Section 7 |
| Độ dài file tối đa: 300 dòng | ✅ Đạt | AGENTS.md Section 7 |
| Test coverage: Tối thiểu 80% cho Service layer | ✅ Đạt | AGENTS.md Section 7 |
| Comments: Chỉ giải thích WHY, không giải thích WHAT | ✅ Đạt | AGENTS.md Section 7 |

**Kết Luận**: KHÔNG có vi phạm constitution. Tính năng hoàn toàn tuân thủ mọi ràng buộc kiến trúc, bảo mật, và chất lượng code.

---

## 4. Cấu Trúc Dự Án (Project Structure)

### Tài Liệu (Documentation)

```text
.sdd/CuongLH/UC18-feat-profile-view/
├── spec.md                  # Đặc tả tính năng (ĐÃ CÓ)
├── context.md               # Phát biểu bài toán (ĐÃ CÓ)
├── plan.md                  # File này - Kế hoạch triển khai
├── research.md              # Nghiên cứu kỹ thuật (ĐÃ CÓ)
├── data-model.md            # Thiết kế schema & queries (ĐÃ CÓ)
├── quickstart.md            # Hướng dẫn sử dụng API (ĐÃ CÓ)
├── contracts/               # Hợp đồng API (ĐÃ CÓ)
│   ├── api-contract.md      #   Đặc tả REST endpoint
│   └── service-contract.md  #   Đặc tả Service interface
└── tasks.md                 # Danh sách tác vụ nguyên tử (CHƯA TẠO - sẽ sinh bởi /speckit-tasks)
```

### Mã Nguồn (Source Code)

```text
backend/
├── prisma/
│   ├── schema.prisma                # [TẠO MỚI] Định nghĩa Prisma schema
│   └── migrations/                  # [TỰ SINH] Prisma migrations
│
├── src/
│   ├── controllers/
│   │   └── profile.controller.js    # [TẠO MỚI] Điều khiển request/response
│   │
│   ├── services/
│   │   └── profile.service.js       # [TẠO MỚI] Business logic + sanitization
│   │
│   ├── repositories/
│   │   └── profile.repository.js    # [TẠO MỚI] Data access qua Prisma
│   │
│   ├── validators/
│   │   └── profile.validator.js     # [TẠO MỚI] Zod schema (tùy chọn - endpoint GET không có body)
│   │
│   ├── routes/
│   │   └── user.routes.js           # [SỬA] Thêm route GET /me
│   │
│   ├── middleware/
│   │   └── auth.middleware.js       # [ĐÃ CÓ] JWT authentication
│   │
│   └── utils/
│       ├── response.util.js         # [ĐÃ CÓ] Định dạng response chuẩn
│       └── jwt.util.js              # [ĐÃ CÓ] JWT utilities
│
└── tests/
    ├── integration/
    │   └── profile.test.js          # [TẠO MỚI] API integration tests
    │
    └── unit/
        ├── profile.service.test.js  # [TẠO MỚI] Service layer unit tests
        └── profile.repository.test.js # [TẠO MỚI] Repository unit tests

frontend/
├── src/
│   ├── components/
│   │   └── pages/
│   │       └── ProfilePage.jsx      # [TẠO MỚI] Trang hiển thị hồ sơ
│   │
│   ├── api/
│   │   └── profileApi.js            # [TẠO MỚI] API client (Axios)
│   │
│   └── services/
│       └── profile.service.js       # [TẠO MỚI] Frontend service layer
│
└── tests/
    └── ProfilePage.test.jsx         # [TẠO MỚI] Component tests
```

**Quyết Định Cấu Trúc**: Tính năng tuân thủ kiến trúc Web Application chuẩn với Backend (Express + Prisma) và Frontend (React). Backend áp dụng kiến trúc phân tầng Controller → Service → Repository để tách biệt mối quan tâm (separation of concerns), giúp kiểm thử và bảo trì dễ dàng. Frontend sử dụng kiến trúc component-based với lớp API client riêng biệt.

---

## 5. Theo Dõi Độ Phức Tạp (Complexity Tracking)

> **Chỉ điền nếu Constitution Check phát hiện vi phạm cần giải trình**

| Vi Phạm (Violation) | Lý Do Cần Thiết (Why Needed) | Phương Án Đơn Giản Hơn Bị Từ Chối (Simpler Alternative Rejected Because) |
|---------------------|------------------------------|--------------------------------------------------------------------------|
| Không có vi phạm | — | — |

**Ghi Chú**: Tính năng này hoàn toàn tuân thủ constitution. Không có vi phạm nào về kiến trúc, bảo mật, hoặc chất lượng code cần giải trình.

---

## 6. Các Giai Đoạn Triển Khai (Implementation Phases)

### Phase 0: Nghiên Cứu & Xác Minh (Research & Verification) — CHỈ ĐỌC

**Mục Tiêu**: Khảo sát codebase hiện có, xác định dependencies, và xác minh tính khả thi kỹ thuật trước khi thiết kế.

**Các Tác Vụ**:

1. **Xác Minh Auth Middleware** — Đọc `backend/src/middleware/auth.middleware.js` để xác nhận:
   - JWT token được trích xuất từ cookie nào? (hiện tại: `req.cookies.token`)
   - `req.user` chứa những trường dữ liệu gì? (cần xác minh cấu trúc payload và so sánh với yêu cầu của spec)
   - Mã lỗi hiện có: `UNAUTHORIZED`, `TOKEN_INVALID`

2. **Xác Minh Response Utilities** — Đọc `backend/src/utils/response.util.js` để xác nhận:
   - Định dạng response: `{ success, message, data/code/details }`
   - Các hàm có sẵn: `successResponse(data, message)`, `errorResponse(message, code, details)`
   - Cấu trúc lớp `ServiceError`

3. **Kiểm Tra Trạng Thái Prisma** — Xác minh hiện trạng Prisma trong dự án:
   - ❌ `backend/prisma/schema.prisma` CHƯA TỒN TẠI (cần tạo mới từ đầu)
   - Cần chạy `npx prisma init` để khởi tạo
   - Cần định nghĩa models: User, Skill, UserSkill

4. **Đọc Lại DATABASE.md Schema** — Đối chiếu schema từ DATABASE.md Section 3:
   - Bảng `users`: id, email, password_hash, full_name, phone, avatar_url, role_id, is_active, email_verified
   - Bảng `skills`: id, name, description, is_active
   - Bảng `user_skills`: id, user_id, skill_id (many-to-many)
   - Indexes: PRIMARY, UNIQUE(email), INDEX(is_active)

5. **Ghi Nhận Kết Quả** — Tạo `research.md` chứa:
   - Sơ đồ luồng xác thực hiện tại (authentication flow diagram)
   - Sơ đồ quan hệ thực thể (ERD: users ↔ user_skills ↔ skills)
   - Khoảng cách (gap) giữa code hiện tại và phạm vi của `context.md`/`spec.md`
   - Các rủi ro/trở ngại đã xác định

**Đầu Ra**: File `research.md` với các phát hiện kỹ thuật và quyết định kiến trúc.

---

### Phase 1: Thiết Kế & Hợp Đồng (Design & Contracts) — CHỈ ĐỌC

**Mục Tiêu**: Thiết kế data models, API contracts, và service interfaces trước khi viết code.

**Các Tác Vụ**:

#### 1.1 Thiết Kế Database Schema (`data-model.md`)

Nội dung cần có:

- Mô tả 3 bảng nguồn dữ liệu: `users`, `skills`, `user_skills`
- Liệt kê rõ các trường trả về theo phạm vi spec: `full_name`, `email`, `phone_number`, `avatar_url`, `skills`
- Thể hiện ánh xạ (mapping) giữa `users.phone` trong database và `phone_number` trong API response
- Chỉ rõ các trường nội bộ phải loại bỏ khỏi response (password_hash, role_id, email_verified, ...)
- Chỉ rõ điều kiện lọc `skills.is_active = true` và cách xử lý trường hợp `skills: []` (mảng rỗng - không có kỹ năng)

#### 1.2 Hợp Đồng API (`contracts/api-contract.md`)

Nội dung cần có:

- Định nghĩa endpoint: `GET /api/v1/user/me`
- Chỉ rõ phương thức xác thực: JWT trong httpOnly cookie
- Ví dụ success response với trường `phone_number` theo đúng spec
- Bao phủ đầy đủ các mã lỗi: `UNAUTHORIZED`, `TOKEN_INVALID`, `USER_NOT_FOUND`, `ACCOUNT_DISABLED`, `INTERNAL_SERVER_ERROR`
- Nhấn mạnh nguyên tắc self-view only (chỉ xem hồ sơ của chính mình) và không nhận định danh từ client

#### 1.3 Hợp Đồng Service (`contracts/service-contract.md`)

Nội dung cần có:

- Input là định danh người dùng đã được JWT xác thực (không phải từ request)
- Output phải dùng `phone_number` để khớp với spec
- Định nghĩa các lỗi nghiệp vụ (business errors) chuẩn của UC18
- Chỉ rõ dependency vào Repository layer và logic sanitize/transformation

#### 1.4 Hướng Dẫn Nhanh (`quickstart.md`)

Nội dung cần có:

- Hướng dẫn test API bằng `curl` và Postman
- Ví dụ tích hợp frontend với `withCredentials: true`
- Expected response mẫu phải dùng `phone_number`
- Có đủ happy path và error path cơ bản

**Đầu Ra**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Lập Kế Hoạch Triển Khai Chi Tiết (Implementation Planning) — SẴN SÀNG PHÊ DUYỆT

**Mục Tiêu**: Chia nhỏ implementation thành các tác vụ nguyên tử (atomic tasks)

**Ghi Chú**: Giai đoạn này sẽ được thực hiện bằng lệnh `/speckit-tasks` sau khi plan được phê duyệt.

**Đầu Ra Dự Kiến**: `tasks.md` với danh sách tác vụ:

| Task | Mô Tả | Tầng |
|------|-------|------|
| T001 | Thiết lập Prisma schema và migrations | Database |
| T002 | Triển khai ProfileRepository | Repository |
| T003 | Triển khai ProfileService với data sanitization | Service |
| T004 | Triển khai ProfileController | Controller |
| T005 | Cập nhật user.routes.js thêm GET /me | Routes |
| T006 | Viết unit tests cho Service | Tests |
| T007 | Viết unit tests cho Repository | Tests |
| T008 | Viết integration tests cho API endpoint | Tests |
| T009 | Triển khai ProfilePage component (frontend) | Frontend |
| T010 | Triển khai API client (frontend) | Frontend |
| T011 | Kiểm thử end-to-end | Tests |

**Chuỗi Phụ Thuộc (Dependency Chain)**: Các tác vụ phải được thực hiện theo đúng thứ tự do có dependency chain:

```
Database (T001) → Repository (T002) → Service (T003) → Controller (T004) → Routes (T005) → Tests (T006-T008)
                                                                                    ↓
                                                                           Frontend (T009-T010) → E2E (T011)
```

---

## 7. Đánh Giá Rủi Ro (Risk Assessment)

| Rủi Ro (Risk) | Tác Động (Impact) | Xác Suất (Probability) | Biện Pháp Giảm Thiểu (Mitigation) |
|---------------|-------------------|----------------------|-----------------------------------|
| **Prisma chưa được thiết lập** — Backend hiện chưa có Prisma schema. Cần thiết lập toàn bộ từ đầu (init, schema, migrate). | **CAO** — Nếu xung đột với database hiện có hoặc cần refactor authentication code sẽ gây chậm tiến độ nghiêm trọng. | Trung Bình — Database schema đã được định nghĩa rõ trong DATABASE.md. | Đọc kỹ DATABASE.md, tạo schema bám sát spec, kiểm thử migration trên dev DB trước khi áp dụng chính thức. |
| **Rò rỉ dữ liệu nhạy cảm** — Nếu quên sanitize, password_hash hoặc các trường nội bộ có thể bị lộ ra ngoài response. | **CAO** — Lỗ hổng bảo mật nghiêm trọng, vi phạm constitution Layer 1. | Thấp — Prisma `select` cho phép chọn trường tường minh. | Dùng Prisma `select` để chỉ định chính xác các trường trả về, tạo utility function `sanitizeUser()`, viết test case riêng để phát hiện data leakage. |
| **Cấu trúc JWT payload không khớp** — `context.md` và `spec.md` yêu cầu định danh từ JWT nhưng implementation hiện tại có thể khác. | Trung Bình — Code và tài liệu không đồng bộ, gây nhầm lẫn khi triển khai. | Trung Bình — Auth middleware đã hoạt động, cần xác minh. | Phase 0 phải kiểm tra `jwt.util.js` và `auth.service.js`, sau đó chốt rõ cách thức đáp ứng yêu cầu định danh. |
| **Hiệu năng truy vấn** — Query join 3 bảng (users + user_skills + skills). | Thấp — Có thể chậm hơn ngưỡng 300ms nếu không có index phù hợp. | Thấp — DATABASE.md đã định nghĩa đầy đủ indexes. | Prisma tự động sử dụng indexes, kiểm thử hiệu năng với 200 concurrent requests. |

---

## 8. Đối Chiếu Tiêu Chí Thành Công (Success Criteria Review)

Ánh xạ từ spec.md Success Criteria sang các sản phẩm bàn giao (deliverables):

| Mã SC | Tiêu Chí Thành Công | Phương Pháp Kiểm Chứng |
|-------|--------------------|-----------------------|
| SC-001 | Thời gian phản hồi < 1s với 200 concurrent requests | Kiểm thử tải bằng artillery hoặc k6 |
| SC-002 | Chặn 100% request không có token hợp lệ | Integration test: request không token, token hết hạn, token giả mạo |
| SC-003 | Response không chứa dữ liệu nhạy cảm | Unit test: kiểm tra response KHÔNG chứa password_hash, role_id, email_verified, ... |
| SC-004 | Xử lý đúng trường hợp không có kỹ năng (skills = []) | Unit test: user có 0 skills → response.skills = [] |
| SC-005 | Chịu tải 200 concurrent requests | Kiểm thử tải bằng artillery |
| SC-006 | Không có lỗ hổng IDOR | Integration test: không thể đọc profile người khác bằng cách thay đổi userId |

---

## 9. Danh Sách Kiểm Tra Trước Triển Khai (Deployment Checklist)

Trước khi merge vào nhánh chính:

- [ ] Prisma schema đã được review và phê duyệt
- [ ] Prisma migrations chạy thành công trên database phát triển (dev DB)
- [ ] Unit tests đạt (≥80% coverage cho Service layer)
- [ ] Integration tests đạt (tất cả các kịch bản từ spec.md)
- [ ] Kiểm thử tải xác nhận response time < 1s với 200 concurrent requests
- [ ] Kiểm tra bảo mật: Xác nhận không có rò rỉ dữ liệu nhạy cảm
- [ ] Tài liệu API (Swagger) đã được cập nhật trong `backend/src/routes/`
- [ ] Kiểm thử tích hợp frontend đạt
- [ ] Code review được phê duyệt bởi ít nhất 1 thành viên khác
- [ ] Kiểm tra tuân thủ CONSTITUTION.md (kiến trúc, bảo mật, chất lượng code)

---

## 10. Các Bước Tiếp Theo (Next Steps)

1. **Phê duyệt kế hoạch này** — Team lead hoặc người phụ trách review và approve plan.
2. **Làm rõ cấu trúc JWT payload** — Xác minh chính xác `req.user` chứa những claim nào để implementation bám sát đúng phạm vi spec.
3. **Quyết định phương án Prisma** — Chốt sẽ thiết lập Prisma mới hoàn toàn (khuyến nghị: theo ADR-001) hay dùng raw SQL queries.
4. **Rà soát bộ tài liệu hiện có** — Đảm bảo research.md, data-model.md, contracts, quickstart.md đồng bộ với context.md và spec.md.
5. **Chạy `/speckit-tasks`** — Sinh tasks.md với danh sách tác vụ nguyên tử (Phase 2).
6. **Bắt đầu triển khai** — Thực hiện các tác vụ theo đúng chuỗi phụ thuộc.

---

## 11. Câu Hỏi Cho Các Bên Liên Quan (Questions for Stakeholders)

### 1. Chiến Lược Database Migration

**Câu Hỏi**: Hiện tại backend đã có database đang chạy chưa? Cần migrate dữ liệu cũ hay thiết lập database mới hoàn toàn?

**Tầm Quan Trọng (Context)**: Quyết định này ảnh hưởng trực tiếp đến cách thiết lập Prisma schema và chiến lược migration. Nếu đã có dữ liệu thật, cần migrate cẩn thận. Nếu chưa có, có thể tạo mới hoàn toàn.

**Các Lựa Chọn (Options)**:

- **(A)** Database đã có dữ liệu — cần migrate dữ liệu cũ sang schema mới
- **(B)** Database đã có nhưng là dữ liệu test — có thể xóa và tạo mới
- **(C)** Chưa có database — thiết lập mới hoàn toàn từ đầu

**Đề Xuất (Recommendation)**: Phương án (C) nếu chưa có database thật. Phương án (B) nếu đã có dữ liệu test.

---

### 2. Prisma vs Raw SQL

**Câu Hỏi**: Team muốn thiết lập Prisma ORM đầy đủ (theo ADR-001) hay tạm thời dùng raw SQL queries để triển khai nhanh hơn?

**Tầm Quan Trọng (Context)**: Prisma cần thời gian thiết lập ban đầu nhưng mang lại type safety, migration management, và giảm SQL injection risk. Raw SQL nhanh hơn để bắt đầu nhưng về lâu dài khó bảo trì.

**Các Lựa Chọn (Options)**:

- **(A)** Thiết lập Prisma ORM đầy đủ — đúng chuẩn ADR-001, tốn thêm thời gian Phase 0
- **(B)** Dùng raw SQL queries — bắt đầu nhanh, nhưng vi phạm ADR-001
- **(C)** Dùng Prisma nhưng chỉ cho module Profile — các module khác dùng raw SQL

**Đề Xuất (Recommendation)**: Phương án (A) — Thiết lập Prisma đầy đủ. Đây là yêu cầu bắt buộc của ADR-001 và sẽ dùng chung cho toàn bộ dự án về sau.

---

### 3. Cấu Trúc JWT Payload

**Câu Hỏi**: Cần xác nhận chính xác `req.user` sau khi qua auth middleware chứa những trường dữ liệu gì (id, email, role_id, ...) để đáp ứng yêu cầu định danh của UC18?

**Tầm Quan Trọng (Context)**: Lớp Service của UC18 cần `userId` để truy vấn profile. Nếu `req.user` không chứa `id` hoặc chứa dưới tên khác, cần điều chỉnh code tương ứng.

**Các Lựa Chọn (Options)**:

- **(A)** `req.user.id` — định danh người dùng chuẩn
- **(B)** `req.user.userId` — tên trường khác
- **(C)** Cần sửa auth middleware để thêm trường `id` vào payload

**Đề Xuất (Recommendation)**: Cần Phase 0 research để trả lời chính xác. Dựa trên codebase hiện tại, khả năng cao là `req.user.id`.

---

### 4. Ưu Tiên Kiểm Thử

**Câu Hỏi**: Ưu tiên viết tests trước (TDD — Test-Driven Development) hay triển khai code trước rồi viết tests sau?

**Tầm Quan Trọng (Context)**: TDD giúp code chất lượng cao hơn nhưng tốn thời gian hơn trong giai đoạn đầu. Viết tests sau giúp triển khai nhanh hơn nhưng dễ bỏ sót edge cases.

**Các Lựa Chọn (Options)**:

- **(A)** TDD: Viết tests trước, code sau (đảm bảo ≥80% coverage)
- **(B)** Code trước, tests sau: Triển khai nhanh, bổ sung tests sau khi code hoạt động
- **(C)** Kết hợp: Viết unit tests song song với implementation

**Đề Xuất (Recommendation)**: Phương án (A) — TDD. Tuân thủ tiêu chuẩn dự án (AGENTS.md Section 7 yêu cầu ≥80% coverage). Đặc biệt quan trọng với security test cases như SC-003 (data leakage) và SC-006 (IDOR).

---

## 12. Ước Lượng Công Sức (Estimated Effort)

**Tổng Thời Gian Dự Kiến**: 19–27 giờ (1 lập trình viên, bao gồm thiết lập + kiểm thử)

**Phân Bổ Theo Giai Đoạn**:

| Giai Đoạn | Công Việc | Thời Gian |
|-----------|----------|-----------|
| Phase 0 | Nghiên cứu & Xác minh (đọc codebase, xác minh auth, kiểm tra Prisma) | 2–3 giờ |
| Phase 1 | Thiết kế & Hợp đồng (data-model, API contract, service contract, quickstart) | 3–4 giờ |
| Phase 2 (Backend) | Thiết lập Prisma, Repository, Service, Controller, Routes | 6–8 giờ |
| Phase 2 (Testing) | Unit tests + Integration tests + Load tests | 4–6 giờ |
| Phase 2 (Frontend) | ProfilePage component + API client + Component tests | 3–4 giờ |
| Review & Chỉnh Sửa | Code review, sửa lỗi, cập nhật Swagger | 1–2 giờ |

---

## 13. Mức Độ Ưu Tiên (Priority)

**Mức**: **P1 — Tính Năng Cốt Lõi (Core Feature)**

**Lý Do**: UC18 View Profile là tính năng nền tảng, blocker cho các tính năng tiếp theo:

- UC19 (Edit Profile) — cần View Profile hoạt động trước
- UC20 (Edit Volunteer Skills) — cần hiển thị skills từ View Profile
- UC21 (View Volunteer History) — chia sẻ chung cấu trúc Profile

---

**Trạng Thái Kế Hoạch**: SẴN SÀNG ĐỂ REVIEW  
**Người Phụ Trách**: Member 1 — CuongLH  
**Module**: Profile Management
