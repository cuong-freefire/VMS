# Kế Hoạch Triển Khai: Xem Chi Tiết Sự Kiện (UC09)

**Branch**: `feat/view-event-detail` | **Ngày**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification từ `spec.md` và context đã được làm rõ tại `context.md`

## Tóm Tắt

Triển khai tính năng **Xem Chi Tiết Sự Kiện Tình Nguyện** cho phép Guest và Volunteer xem thông tin toàn diện của một sự kiện. Tính năng bao gồm:

- **Backend**: Xây dựng REST API `GET /api/v1/events/:id` trả về đầy đủ thông tin sự kiện công khai bao gồm: thông tin cơ bản (title, description, image_url, location, start_date, end_date, application_deadline, max_capacity, approved_participants, status), danh mục (category), thông tin người tạo (created_by), và trạng thái đăng ký của Volunteer hiện tại (nếu đã đăng nhập).
- **Frontend**: Xây dựng trang EventDetailPage hiển thị giao diện responsive, có phân biệt trải nghiệm Guest vs Volunteer (hiển thị nút "Đăng ký ngay" cho Volunteer, nút "Đăng nhập để đăng ký" cho Guest, hiển thị badge trạng thái đơn đăng ký nếu có).

**Phạm vi**: Full-stack (Backend API + Frontend UI), tích hợp với module Auth (optional JWT), module Event (schema Prisma), và tái sử dụng UI components có sẵn (LoadingSpinner, ErrorState, EmptyState, Card, Button).

## Bối Cảnh Kỹ Thuật

**Language/Version**: Node.js 20 LTS + JavaScript (ESM) | React 19 + JSX

**Primary Dependencies**:

- Backend: Express 5.x, Prisma ORM, Zod (validation), Pino (logging), swagger-jsdoc (API doc)
- Frontend: React 19, Material UI, Bootstrap 5, Axios, React Hook Form

**Storage**: MySQL qua Prisma ORM — sử dụng bảng `events`, `event_categories`, `volunteer_applications`, `users` (schema theo DATABASE2.md v3.0)

**Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

**Target Platform**: Web application (Node.js server + React SPA trên browser hiện đại)

**Project Type**: Web application (Monorepo: `backend/` + `frontend/`)

**Performance Goals**:

- API response time < 200ms p95 cho GET /api/v1/events/:id
- Frontend FCP (First Contentful Paint) < 1.5s
- Hỗ trợ 1000 concurrent users xem chi tiết sự kiện

**Constraints**:

- Phải tuân thủ ADR-006 response format (`{ success, message, data, errors }`)
- Auth: Optional JWT — Guest được phép truy cập không cần token, Volunteer có token sẽ nhận thêm thông tin application status
- Không được expose dữ liệu nhạy cảm (password hash, token, email của người dùng khác)
- Tuân thủ kiến trúc phân tầng Controller → Service → Repository
- Chỉ hiển thị sự kiện có trạng thái `PUBLISHED`, `IN_PROGRESS`, `COMPLETED` và `is_active = true`

**Scale/Scope**:

- 1 API endpoint (GET /api/v1/events/:id) - public, optional auth
- 1 frontend page (EventDetailPage.jsx) + 4 sub-components
- ~10 files mới (backend: 5, frontend: 5)
- Tích hợp với 3 bảng database: `events`, `event_categories`, `volunteer_applications`

## Kiểm Tra Hiến Pháp

*GATE: Phải vượt qua trước Phase 0 research. Kiểm tra lại sau Phase 1 design.*

| Nguyên Tắc | Trạng Thái | Ghi Chú |
|------------|-----------|---------|
| **Layered Architecture** (Controller → Service → Repository) | ✅ PASS | Backend tuân thủ phân tầng: EventController → EventService → EventRepository |
| **API Style** (RESTful + /api/v1/ prefix) | ✅ PASS | Endpoint: `GET /api/v1/events/:id` |
| **Response Format** (ADR-006) | ✅ PASS | Sử dụng `response.util.js`: `{ success, message, data, errors }` |
| **Validation** (Zod) | ✅ PASS | Param `:id` được validate bằng Zod (positive integer) |
| **Auth** (JWT HttpOnly Cookie) | ✅ PASS | Sử dụng `authenticateOptional` middleware — cho phép cả Guest và Volunteer |
| **Database Access** (Prisma ORM only) | ✅ PASS | Repository layer sử dụng Prisma Client, không raw SQL |
| **Logging** (Pino) | ✅ PASS | Mọi lỗi được log qua Pino logger |
| **Testing** (>80% Service coverage) | ✅ PASS | Target: EventService >80%, EventController integration tests |
| **Swagger Documentation** | ✅ PASS | JSDoc @swagger đầy đủ trên controller |
| **Module Boundaries** | ✅ PASS | Không import trực tiếp repository của module khác; giao tiếp qua Service |
| **No TODO/FIXME in final code** | ✅ PASS | Sẽ được kiểm tra trước merge |
| **Soft Delete compliance** | ✅ PASS | Event dùng `is_active = false`, Application dùng state transition |
| **Visibility Enforcement** (Domain Rule) | ✅ PASS | Chỉ hiển thị sự kiện `PUBLISHED`, `IN_PROGRESS`, `COMPLETED` + `is_active = true` cho Guest/Volunteer |

**Kết luận**: Tất cả constitutional checks PASS. Không có vi phạm cần ghi nhận ở Complexity Tracking.

## Cấu Trúc Dự Án

### Tài Liệu (feature này)

```text
.sdd/CuongLH/UC09-feat-view-event-detail/
├── spec.md              # Feature specification (đã có)
├── context.md           # Clarification answers (đã có)
├── plan.md              # File này (Kế hoạch triển khai)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-contract.md      # API contract cho GET /api/v1/events/:id
│   └── service-contract.md  # Service layer interface
└── tasks.md             # Phase 2 output (tạo bởi /speckit-tasks)
```

### Source Code (repository root)

```text
# Backend - Module Event mới
backend/
├── src/
│   ├── controllers/
│   │   └── event.controller.js          # [MỚI] Xử lý request GET /api/v1/events/:id
│   ├── services/
│   │   └── event.service.js             # [MỚI] Business logic lấy & enrich dữ liệu sự kiện
│   ├── repositories/
│   │   └── event.repository.js          # [MỚI] Truy vấn Prisma - lấy event + category + created_by
│   ├── routes/
│   │   └── event.routes.js              # [MỚI] Định nghĩa route GET /api/v1/events/:id (public, optional auth)
│   ├── middlewares/
│   │   ├── auth.middleware.js            # [CÓ SẴN] Cần thêm authenticateOptional
│   │   └── validators/
│   │       ├── event.validator.js        # [MỚI] Zod schema validate :id param (positive integer)
│   │       └── validate.js               # [CÓ SẴN] Middleware validate request
│   └── app.js                           # [SỬA] Thêm route mount cho event routes
├── prisma/
│   └── schema.prisma                     # [CÓ SẴN] Đã có model Event, EventCategory, VolunteerApplication
└── tests/
    ├── unit/
    │   └── event.service.test.js         # [MỚI] Unit test EventService
    └── integration/
        └── event.test.js                # [MỚI] Integration test GET /api/v1/events/:id

# Frontend - Trang EventDetail mới
frontend/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   └── EventDetailPage.jsx       # [MỚI] Trang chi tiết sự kiện chính
│   │   └── events/
│   │       ├── EventInfoCard.jsx          # [MỚI] Card thông tin cơ bản sự kiện
│   │       ├── EventCategoryBadge.jsx     # [MỚI] Badge hiển thị danh mục sự kiện
│   │       ├── EventStatusBadge.jsx       # [MỚI] Badge trạng thái (PUBLISHED/IN_PROGRESS/COMPLETED)
│   │       ├── EventRegistrationSection.jsx # [MỚI] Khu vực đăng ký (nút Apply/badge đơn)
│   │       └── EventDetailSkeleton.jsx    # [MỚI] Skeleton loading cho trang
│   ├── services/
│   │   └── event.service.js              # [MỚI] Axios API calls cho event
│   ├── hooks/
│   │   └── useEventDetail.js             # [MỚI] Custom hook fetch dữ liệu event detail
│   └── App.js                            # [SỬA] Thêm route /events/:id
└── tests/
    └── components/
        └── EventDetailPage.test.jsx       # [MỚI] Component test
```

**Quyết Định Cấu Trúc**:

- Backend theo mô hình Module mới với đầy đủ Controller-Service-Repository tuân thủ kiến trúc phân tầng. Endpoint `GET /api/v1/events/:id` là **public** (không yêu cầu auth), nhưng hỗ trợ optional auth để cá nhân hóa response cho Volunteer.
- Frontend tạo thư mục `components/events/` mới để nhóm các component liên quan đến sự kiện, tương tự cách tổ chức `components/profile/` cho UC21.
- KHÔNG có sub-component cho Skills hoặc Organization vì đây là scope Guest + Volunteer (không hiển thị dữ liệu nội bộ).
- Tất cả file mới được đánh dấu `[MỚI]`, file cần sửa đánh dấu `[SỬA]`.

## Theo Dõi Độ Phức Tạp

> **Không có vi phạm Constitutional Check nào — bảng này để trống.**

| Vi Phạm | Lý Do Cần Thiết | Giải Pháp Đơn Giản Hơn Bị Từ Chối Vì |
|---------|----------------|--------------------------------------|
| *(Không có)* | | |

## Các Pha Triển Khai

### Phase 0: Nghiên Cứu & Xác Minh (READ-ONLY)

**Mục Tiêu**: Xác minh schema Prisma hiện có cho Event, xác định chiến lược query tối ưu (N+1 problem), và chốt contract API response format.

**Nhiệm Vụ**:

1. **Kiểm tra Prisma Schema** — Xác minh model `Event` và các quan hệ: `EventCategory` (1-n), `VolunteerApplication` (1-n), `User` (created_by). Xác định fields cần `select` vs `include` để tránh over-fetching. Xác nhận không có quan hệ với `Organization` hoặc `Skills` ở scope này.

2. **Nghiên cứu chiến lược truy vấn** — So sánh giữa: (A) Một Prisma query với nested `include` (đơn giản, có thể bị N+1), (B) Nhiều query song song + ghép thủ công (tối ưu hơn). Với scope hiện tại (Event + Category + created_by user + optional application), nested `include` là đủ và không gây N+1 nghiêm trọng.

3. **Xác minh Auth Middleware** — Kiểm tra `auth.middleware.js` hiện tại: đã có `authenticate` (bắt buộc) chưa? Cần tạo `authenticateOptional` (không bắt buộc) để hỗ trợ dual-mode Guest/Volunteer. Xác định cách lấy `userId` từ `req.user` khi có token.

4. **Nghiên cứu slot display** — `approved_participants` và `max_capacity` đã có sẵn trong bảng `events`. Công thức hiển thị: `approved_participants / max_capacity`. Khi `approved_participants >= max_capacity`, hiển thị "Đã đầy".

5. **Tham khảo API tương tự** — Xem cách UC21 (View Volunteer History) tổ chức controller/service/repository để đảm bảo consistency.

**Output**: `research.md` với các quyết định kỹ thuật và kiến trúc đã chốt.

---

### Phase 1: Thiết Kế & Hợp Đồng (READ-ONLY)

**Mục Tiêu**: Thiết kế data model cho response, định nghĩa API contract, và viết tài liệu hướng dẫn.

**Nhiệm Vụ**:

1. **Data Model** — Thiết kế cấu trúc response JSON cho `GET /api/v1/events/:id` bao gồm:
   - `event`: thông tin cơ bản (id, title, description, image_url, location, start_date, end_date, application_deadline, max_capacity, approved_participants, status, created_at)
   - `category`: { id, name } (từ bảng `event_categories`)
   - `created_by`: { id, full_name } (từ bảng `users` — KHÔNG trả về email, phone, role)
   - `user_application`: null | { id, status, created_at } (chỉ khi đã đăng nhập với role VOLUNTEER)

2. **API Contracts** — Định nghĩa đầy đủ Swagger JSDoc cho endpoint:
   - HTTP Method: GET
   - Path: `/api/v1/events/:id`
   - Auth: Optional (JWT Cookie — Guest được phép truy cập không cần token)
   - Success Response (200): Full event detail (Guest) hoặc event + user_application (Volunteer)
   - Error Responses: 400 (Invalid ID), 404 (Event not found / không công khai), 500 (Server error)

3. **Service Contracts** — Định nghĩa interface cho `EventService.getEventDetail(eventId, userId?)`:
   - Input: eventId (int), userId (int | null)
   - Output: EventDetailResponse object
   - Validation: eventId phải là số nguyên dương, event phải `is_active = true` VÀ `status IN ('PUBLISHED', 'IN_PROGRESS', 'COMPLETED')`
   - Authorization: Không yêu cầu auth — Guest được phép truy cập

4. **Quick Start Guide** — Hướng dẫn developer chạy và test feature:
   - Cách chạy migration (nếu cần)
   - Cách seed dữ liệu test
   - Cách test API bằng Swagger UI
   - Cách test frontend page

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Lập Kế Hoạch Triển Khai (READY FOR APPROVAL)

**Mục Tiêu**: Chia nhỏ công việc thành các task nguyên tử, có thứ tự phụ thuộc rõ ràng.

**Lưu Ý**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve.

**Dự Kiến Output**: `tasks.md` với atomic task breakdown:

- **Backend Tasks** (theo thứ tự phụ thuộc):
  1. Tạo `event.validator.js` — Zod schema validate `:id` param (positive integer)
  2. Tạo `event.repository.js` — Prisma query lấy event + category + created_by user
  3. Tạo `event.service.js` — Business logic: visibility check, enrich dữ liệu, tra cứu application status
  4. Tạo `event.controller.js` — Xử lý request, gọi service, format response theo ADR-006
  5. Tạo `event.routes.js` — Định nghĩa route GET `/api/v1/events/:id` với optional auth + validator
  6. Cập nhật `app.js` — Mount event routes
  7. Cập nhật `auth.middleware.js` — Thêm authenticateOptional nếu chưa có
  8. Viết `event.service.test.js` — Unit test (>80% coverage: happy path + edge cases + visibility rules)
  9. Viết `event.test.js` — Integration test (Guest, Volunteer có application, Volunteer không application, 404 cho DRAFT/CANCELLED, 400 invalid ID)

- **Frontend Tasks** (sau khi Backend hoàn thành):
  10. Tạo `event.service.js` — Axios API call GET /api/v1/events/:id với error handling
  11. Tạo `useEventDetail.js` — Custom hook fetch dữ liệu, loading/error state, AbortController
  12. Tạo `EventDetailSkeleton.jsx` — Skeleton loading UI cho ảnh, tiêu đề, mô tả
  13. Tạo `EventInfoCard.jsx` — Hiển thị thông tin cơ bản (title, description, location, dates, capacity)
  14. Tạo `EventCategoryBadge.jsx` — Badge hiển thị tên danh mục sự kiện
  15. Tạo `EventStatusBadge.jsx` — Badge trạng thái: "Đang mở đăng ký" / "Đang diễn ra" / "Đã kết thúc"
  16. Tạo `EventRegistrationSection.jsx` — Khu vực đăng ký: nút Apply/badge đơn theo role + user_application
  17. Tạo `EventDetailPage.jsx` — Trang chính lắp ghép tất cả components + ErrorBoundary
  18. Cập nhật `App.js` — Thêm route `/events/:id`
  19. Viết `EventDetailPage.test.jsx` — Component test (Guest view, Volunteer view, loading, 404 error)

**Phụ Thuộc**: Backend task 1→2→3→4→5→6 (chuỗi tuyến tính). Frontend task 10→11→12→17 (hook trước, page sau). Components 13-16 độc lập với nhau, có thể song song hóa.

---

## Đánh Giá Rủi Ro

### RỦI RO CAO

- **Lộ thông tin nhạy cảm qua API**: API trả về quá nhiều dữ liệu từ quan hệ (vd: thông tin cá nhân của volunteer khác đã đăng ký). Rủi ro: Vi phạm quyền riêng tư, lộ email/số điện thoại.
  - **Giảm thiểu**: Dùng Prisma `select` thay vì `include` để giới hạn chính xác fields trả về. Chỉ trả về `application` của chính user đang request (dùng `userId` từ token). TUYỆT ĐỐI không trả về danh sách tất cả applications.

- **N+1 Query Problem**: Prisma nested `include` có thể tạo ra nhiều query con khi lấy category và created_by. Rủi ro: Performance kém với quan hệ lồng sâu.
  - **Giảm thiểu**: Scope hiện tại chỉ có Event + Category + created_by User (3 bảng), N+1 không nghiêm trọng. Sử dụng Prisma `include` với `select` con để giới hạn fields trả về. Đo performance bằng Pino logger.

### RỦI RO TRUNG BÌNH

- **Auth Middleware chưa hỗ trợ optional**: `auth.middleware.js` hiện tại có thể chỉ có `authenticate` bắt buộc (trả 401 nếu không có token). Rủi ro: Guest không thể truy cập endpoint public.
  - **Giảm thiểu**: Tạo middleware `authenticateOptional` — nếu không có token, set `req.user = null` và cho phép tiếp tục. Nếu có token nhưng invalid/expired, vẫn cho phép tiếp tục như Guest (không trả 401). Middleware này đã được dùng trong UC08 và có thể tái sử dụng.

- **Event không tồn tại hoặc đã bị soft-delete**: Guest truy cập event đã bị xóa (`is_active = false`) hoặc ID không tồn tại. Rủi ro: UX kém nếu không có thông báo rõ ràng.
  - **Giảm thiểu**: Backend trả 404 với message tiếng Việt rõ ràng ("Sự kiện không tồn tại hoặc đã bị gỡ bỏ"). Frontend hiển thị ErrorState component với message thân thiện và nút "Quay lại danh sách sự kiện".

### RỦI RO THẤP

- **Frontend routing conflict**: Route `/events/:id` có thể xung đột với các route event khác trong tương lai. Rủi ro: Routing ambiguity.
  - **Giảm thiểu**: Đặt route `/events/:id` ở vị trí phù hợp trong React Router (sau các route cụ thể hơn như `/events/create` nếu có sau này). Dùng regex pattern nếu cần.

- **Cache staleness**: Dữ liệu sự kiện có thể thay đổi (số slot còn trống) trong khi user đang xem trang. Rủi ro: User thấy thông tin cũ.
  - **Giảm thiểu**: Không cache API response phía server. Frontend có thể thêm nút "Làm mới" hoặc auto-refresh nhẹ nhàng (không bắt buộc trong MVP).

---

## Rà Soát Tiêu Chí Thành Công

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: Guest có thể xem toàn bộ thông tin cơ bản của sự kiện mà không cần đăng nhập.
  → **Kiểm chứng**: Integration test: Gửi GET /api/v1/events/:id không có Cookie → Nhận 200 với đầy đủ thông tin event (title, description, location, date, category, slots). `user_application` = null.

- **SC-002**: Trang chi tiết hiển thị đầy đủ các trường thông tin: tiêu đề, mô tả, địa điểm, thời gian, danh mục, số lượng slot.
  → **Kiểm chứng**: Component test: Render EventDetailPage với mock data → Kiểm tra tất cả sections hiển thị đúng dữ liệu.

- **SC-003**: Volunteer đã đăng ký có thể xem trạng thái application của mình trên trang chi tiết.
  → **Kiểm chứng**: Integration test: Gửi GET với Cookie của user đã có application → `user_application` chứa { id, status, created_at }. Frontend test: Hiển thị badge trạng thái tương ứng.

- **SC-004**: Thời gian tải API dưới 200ms và trang frontend hiển thị trong dưới 1.5s.
  → **Kiểm chứng**: Performance test: Đo response time bằng Pino logger. Frontend: Đo FCP bằng React Profiler hoặc Lighthouse.

- **SC-005**: Trang hiển thị chính xác trên mobile, tablet và desktop (responsive).
  → **Kiểm chứng**: Visual test: Kiểm tra giao diện ở breakpoints 320px, 768px, 1024px, 1440px. Dùng MUI Grid và Bootstrap responsive classes.

- **SC-006**: Nút "Đăng ký ngay" chỉ hiển thị với Volunteer đã đăng nhập và chưa đăng ký sự kiện này.
  → **Kiểm chứng**: Component test với 4 scenarios: (1) Guest → thấy nút "Đăng nhập để đăng ký", (2) Volunteer chưa đăng ký → thấy nút "Đăng ký ngay", (3) Volunteer đã đăng ký (PENDING/APPROVED) → thấy badge trạng thái, (4) Volunteer bị REJECTED → thấy badge "Đã bị từ chối".

- **SC-007**: Khi event không tồn tại (sai ID hoặc đã bị soft-delete), hiển thị thông báo lỗi thân thiện.
  → **Kiểm chứng**: Integration test: Gửi GET với ID không tồn tại → 404. Frontend test: Hiển thị ErrorState với message "Sự kiện không tồn tại hoặc đã bị gỡ bỏ".

---

## Danh Sách Kiểm Tra Trước Triển Khai

Trước khi merge vào nhánh chính:

- [ ] Tất cả unit tests passing (>80% coverage cho EventService)
- [ ] Tất cả integration tests passing (happy path + error cases)
- [ ] Swagger JSDoc đầy đủ cho GET /api/v1/events/:id
- [ ] Không có lỗi linting (`npm run lint` pass ở cả backend và frontend)
- [ ] Middleware `authenticateOptional` hoạt động đúng: Guest được phép truy cập, Volunteer nhận thêm `user_application`
- [ ] Response format tuân thủ ADR-006: `{ success, message, data, errors }`
- [ ] Không expose dữ liệu nhạy cảm (password, token, email của user khác)
- [ ] Responsive design hoạt động trên 3 breakpoints chính (mobile, tablet, desktop)
- [ ] Accessible: Hình ảnh có alt text, color contrast đạt WCAG AA
- [ ] Đã xóa tất cả comments `TODO`/`FIXME`
- [ ] Audit log được ghi nhận cho mỗi lần truy cập Event Detail API (event_id, user_id/guest, timestamp, HTTP status)
- [ ] Đã chạy `detect_changes()` để xác minh chỉ các file dự kiến bị ảnh hưởng

---

## Các Bước Tiếp Theo

1. **Review plan này** — Xác nhận phạm vi, technical approach, và risk assessment
2. **Clarify nếu cần** — Trả lời các câu hỏi cho stakeholders bên dưới
3. **Phase 0 execution** — Chạy research.md để chốt technical decisions
4. **Phase 1 execution** — Tạo data-model.md, contracts, quickstart.md
5. **Run /speckit-tasks** — Generate tasks.md với atomic task breakdown
6. **Implementation** — Code theo tasks.md

---

## Câu Hỏi Cho Các Bên Liên Quan

1. **Chủ sở hữu Module Event**: Hiện tại ai là người phụ trách module Event? UC09 tạo mới toàn bộ event module (routes, controller, service, repository) — cần xác nhận không xung đột với kế hoạch của member khác.
   - **Ngữ cảnh**: AGENTS.md quy định phải có xác nhận từ chủ sở hữu module trước khi thay đổi.
   - **Đề xuất**: Nếu CuongLH là chủ sở hữu module Event → tiếp tục. Nếu không → cần sync với chủ sở hữu.

2. **Chiến lược ảnh sự kiện**: Ảnh sự kiện (`image_url`) hiện được lưu ở đâu: Cloudinary, local `backend/public/`, hay external URL? Có cần xử lý fallback image khi không có ảnh không?
   - **Ngữ cảnh**: Ảnh hưởng đến cách hiển thị trên frontend (cần error boundary cho ảnh?).
   - **Tùy chọn**: (A) Dùng Cloudinary URL từ DB, (B) Dùng local path + express.static, (C) Hỗ trợ cả hai
   - **Đề xuất**: (A) Cloudinary — phù hợp với tech stack đã chọn. Có fallback placeholder image khi `image_url = null`.

3. **Trạng thái "Đã hủy" application**: Nếu application bị `CANCELLED`, API có nên trả về `user_application` với status CANCELLED không, hay coi như chưa từng đăng ký (null)?
   - **Ngữ cảnh**: Ảnh hưởng đến UX: nếu CANCELLED → hiển thị "Bạn đã hủy đăng ký" với nút "Đăng ký lại"? Hay coi như chưa đăng ký → hiển thị nút "Đăng ký ngay"?
   - **Tùy chọn**: (A) Trả về CANCELLED và hiển thị trạng thái, (B) Coi CANCELLED = chưa đăng ký (trả null)
   - **Đề xuất**: (A) Trả về CANCELLED — cho phép user thấy lịch sử và quyết định đăng ký lại.

---

**Trạng Thái Kế Hoạch**: SẴN SÀNG ĐỂ XEM XÉT  
**Công Sức Ước Tính**: 12-16 giờ (Phân tích: Phase 0: 2h, Phase 1: 3h, Phase 2: 7-11h)  
**Mức Ưu Tiên**: P1 (High — là tính năng cốt lõi cho cả Guest và Volunteer, là tiền đề cho UC đăng ký sự kiện)
