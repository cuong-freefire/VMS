# Kế Hoạch Triển Khai: Hủy Đơn Đăng Ký (UC14)

**Branch**: `feat/cancel-application` | **Ngày**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification từ `spec.md` và context đã được làm rõ tại `context.md`

## Tóm Tắt

Triển khai tính năng **Hủy Đơn Đăng Ký Sự Kiện** cho phép Volunteer tự hủy đơn đăng ký của chính mình trước khi sự kiện bắt đầu. Tính năng bao gồm:

- **Backend**: Xây dựng REST API `PATCH /api/v1/applications/:id/cancel` cho phép Volunteer chuyển trạng thái đơn từ `PENDING` hoặc `APPROVED` sang `CANCELLED`. Khi hủy đơn `APPROVED`, tự động giảm `approvedParticipants` của sự kiện đi 1. Có kiểm tra toàn diện: quyền sở hữu đơn, trạng thái đơn, trạng thái sự kiện, thời gian bắt đầu sự kiện.
- **Frontend**: Thêm nút "Hủy đơn" trên giao diện EventDetailPage, kèm hộp thoại xác nhận trước khi thực hiện. Sau khi hủy thành công, cập nhật UI tương ứng.

**Phạm vi**: Full-stack (Backend API + Frontend UI), tích hợp với module Auth (JWT required), module Application (mở rộng), module Event (cập nhật capacity).

## Bối Cảnh Kỹ Thuật

**Language/Version**: Node.js 20 LTS + JavaScript (ESM) | React 19 + JSX

**Primary Dependencies**:

- Backend: Express 5.x, Prisma ORM, Zod (validation), Pino (logging), swagger-jsdoc (API doc)
- Frontend: React 19, Material UI, Bootstrap 5, Axios

**Storage**: MySQL qua Prisma ORM — sử dụng bảng `applications`, `events`, `users` (schema theo DATABASE2.md v3.0)

**Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

**Target Platform**: Web application (Node.js server + React SPA trên browser hiện đại)

**Project Type**: Web application (Monorepo: `backend/` + `frontend/`)

**Performance Goals**:

- API response time < 200ms p95 cho PATCH /api/v1/applications/:id/cancel
- Atomic operation: cập nhật application status + giảm approvedParticipants trong cùng transaction
- Không được phép race condition khi nhiều volunteer hủy cùng lúc

**Constraints**:

- Phải tuân thủ ADR-006 response format (`{ success, message, data, errors }`)
- Auth: JWT required — chỉ Volunteer mới được hủy
- Tuân thủ kiến trúc phân tầng Controller → Service → Repository
- Application state machine: PENDING → CANCELLED, APPROVED → CANCELLED (one-way only)
- Không được hủy đơn khi sự kiện đã bắt đầu (`startDate <= now`)
- Khi hủy đơn APPROVED, `approvedParticipants` phải giảm 1 và không được < 0
- Đơn REJECTED hoặc đã CANCELLED không được hủy lại
- Chỉ cho phép hủy khi sự kiện có trạng thái `PUBLISHED` (FR-005)
- Không gửi email, không lưu lý do hủy, không audit log riêng (scope constraints)

**Scale/Scope**:

- 1 API endpoint (PATCH /api/v1/applications/:id/cancel) - auth required (Volunteer only)
- Phạm vi gồm một API endpoint, các tầng xử lý liên quan của module Application, phần gọi API và giao diện hủy đơn ở frontend, cùng các test backend và frontend.
- Tích hợp với 3 bảng database: `applications`, `events`, `users`

## Bảng Ánh Xạ Success Criteria (SC)

Mapping từ spec.md sang implementation deliverables:

| SC | Nội dung Spec | Kiểm Chứng |
|----|--------------|------------|
| **SC-001** | 100% yêu cầu hủy hợp lệ (PENDING/APPROVED) → CANCELLED | Integration test: Gửi PATCH /api/v1/applications/:id/cancel với Cookie của chủ đơn PENDING → 200, status=CANCELLED. Gửi với đơn APPROVED → 200, status=CANCELLED. |
| **SC-002** | Hủy PENDING không làm thay đổi `approvedParticipants` | Integration test: Tạo event với approvedParticipants=5. Hủy đơn PENDING → approvedParticipants vẫn = 5. |
| **SC-003** | Hủy APPROVED: `approvedParticipants` giảm đúng 1, không được < 0 | Integration test: Tạo event với approvedParticipants=5. Hủy đơn APPROVED → approvedParticipants=4. Kiểm tra không thể giảm xuống < 0. |
| **SC-004** | 100% yêu cầu hủy không hợp lệ → HTTP status code + message phù hợp | Integration test: Từng error case (401, 403, 404, 409) → đúng status code + message. |
| **SC-005** | 100% thao tác hủy từ giao diện phải hiển thị hộp thoại xác nhận trước khi gửi API | Component test: Render nút Hủy → Click → Dialog hiển thị với thông tin sự kiện. Xác nhận → API gọi. Hủy bỏ → Dialog đóng, không gọi API. |

## Kiểm Tra Hiến Pháp

*GATE: Phải vượt qua trước Phase 0 research. Kiểm tra lại sau Phase 1 design.*

| Nguyên Tắc | Trạng Thái | Ghi Chú |
|------------|-----------|---------|
| **Layered Architecture** (Controller → Service → Repository) | ✅ PASS | Backend tuân thủ phân tầng: ApplicationController → ApplicationService → ApplicationRepository. Service không gọi trực tiếp Prisma model — mọi thao tác dữ liệu đều đi qua Repository. |
| **API Style** (RESTful + /api/v1/ prefix) | ✅ PASS | Endpoint: `PATCH /api/v1/applications/:id/cancel` |
| **Response Format** (ADR-006) | ✅ PASS | Sử dụng `response.util.js`: `{ success, message, data, errors }` |
| **Validation** (Zod) | ✅ PASS | Param `:id` được validate bằng Zod (positive integer) |
| **Auth** (JWT HttpOnly Cookie) | ✅ PASS | Sử dụng `authenticate` middleware — chỉ Volunteer được phép |
| **Database Access** (Prisma ORM only) | ✅ PASS | Repository layer sử dụng Prisma Client với transaction cho atomic operation. Service KHÔNG gọi trực tiếp Prisma model. |
| **Logging** (Pino) | ✅ PASS | Mọi lỗi được log qua Pino logger |
| **Testing** (>80% Service coverage) | ✅ PASS | Target: ApplicationService >80%, Integration tests cho API |
| **Swagger Documentation** | ✅ PASS | JSDoc @swagger đầy đủ trên controller |
| **Module Boundaries** | ✅ PASS | Giao tiếp qua Service layer; ApplicationService điều phối nghiệp vụ, ApplicationRepository và EventRepository chỉ thực hiện thao tác dữ liệu thuộc phạm vi của mình, dùng chung transaction context. Service không gọi Prisma model trực tiếp. |
| **No TODO/FIXME in final code** | ✅ PASS | Sẽ được kiểm tra trước merge |
| **Soft Delete compliance** | ✅ PASS | Application dùng state transition (status = CANCELLED), không hard delete |
| **Domain Rules - Application** | ✅ PASS | State machine one-way: PENDING/APPROVED → CANCELLED; REJECTED không được hủy |
| **Domain Rules - Event Capacity** | ✅ PASS | `approvedParticipants` giảm 1 khi hủy APPROVED; không được < 0 |
| **Domain Rules - Event Status** | ✅ PASS | Chỉ hủy được khi sự kiện chưa bắt đầu (`startDate > now`) và status = PUBLISHED |

**Kết luận**: Tất cả constitutional checks PASS. Không có vi phạm cần ghi nhận ở Complexity Tracking.

## Cấu Trúc Dự Án

### Tài Liệu (feature này)

```text
.sdd/CuongLH/UC14-feat-cancel-application/
├── spec.md              # Feature specification (đã có)
├── context.md           # Clarification answers (đã có)
├── plan.md              # File này (Kế hoạch triển khai)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-contract.md      # API contract cho PATCH /api/v1/applications/:id/cancel
│   └── service-contract.md  # Service layer interface
└── tasks.md             # Phase 2 output (tạo bởi /speckit-tasks)
```

### Source Code (repository root)

```text
# Backend - Module Application mở rộng
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js     # [MỚI] Xử lý request PATCH /api/v1/applications/:id/cancel
│   ├── services/
│   │   └── application.service.js        # [MỚI] Business logic hủy đơn + validation, điều phối transaction
│   ├── repositories/
│   │   ├── application.repository.js     # [SỬA] Thêm findById, findByIdInTransaction, cancelApplicationWithStatus, findByIdAfterUpdate (nhận transaction context)
│   │   └── event.repository.js           # [SỬA] Thêm findByIdInTransaction, findEligibleEventForCancellation, decrementApprovedParticipants (nhận transaction context)
│   ├── routes/
│   │   └── application.routes.js         # [MỚI] Định nghĩa route PATCH /api/v1/applications/:id/cancel (auth required, Volunteer only)
│   ├── middlewares/
│   │   ├── auth.middleware.js             # [CÓ SẴN] Đã có authenticate, authorize('VOLUNTEER')
│   │   └── validators/
│   │       ├── application.validator.js   # [MỚI] Zod schema validate :id param
│   │       └── validate.js                # [CÓ SẴN] Middleware validate request
│   └── app.js                            # [SỬA] Thêm route mount cho application routes
├── prisma/
│   └── schema.prisma                     # [CÓ SẴN] Đã có model Application, Event
└── tests/
    ├── unit/
    │   └── application.service.test.js    # [MỚI] Unit test ApplicationService
    └── integration/
        └── application.cancel.test.js     # [MỚI] Integration test PATCH /api/v1/applications/:id/cancel

# Frontend - Thêm nút Hủy trên UI
frontend/
├── src/
│   ├── components/
│   │   └── pages/
│   │       └── EventDetailPage.jsx        # [SỬA] Thêm nút "Hủy đơn" + confirm dialog cho Volunteer đã đăng ký
│   ├── services/
│   │   └── application.service.js         # [MỚI] Axios API call PATCH /api/v1/applications/:id/cancel
│   └── App.js                             # [KHÔNG SỬA] Không cần thêm route mới
└── tests/
    └── components/
        └── CancelApplication.test.jsx      # [MỚI] Component test cho nút hủy + dialog
```

**Quyết Định Cấu Trúc**:

- Backend tạo module Application riêng (application.controller, application.service, application.routes) vì đây là logic độc lập, không thuộc về event. Event routes chỉ phục vụ việc xem/browse sự kiện.
- **Chiến lược transaction**: `ApplicationService` chịu trách nhiệm điều phối nghiệp vụ hủy, mở transaction context qua Prisma interactive transaction API (`prisma.$transaction` với callback), truyền `tx` (transaction client) cho `ApplicationRepository` và `EventRepository`. Hai repository chỉ thực hiện thao tác dữ liệu thuộc phạm vi của mình, không tự mở transaction riêng. Toàn bộ thao tác trong transaction thành công cùng nhau hoặc thất bại cùng nhau.
- **Phân tầng nghiêm ngặt**: `ApplicationService` chỉ điều phối nghiệp vụ và transaction. Service **không gọi trực tiếp** bất kỳ Prisma model operation nào (`tx.application`, `tx.event`, v.v.). Mọi thao tác đọc và ghi dữ liệu đều đi qua Repository. Transaction client `tx` được Service truyền vào Repository. Trình tự đúng trong transaction:
  1. `applicationRepository.findByIdInTransaction(applicationId, tx)` — đọc trạng thái mới nhất
  2. `eventRepository.findEligibleEventForCancellation(eventId, now, tx)` — kiểm tra Event vẫn PUBLISHED, chưa bắt đầu, và không bị thay đổi đồng thời (cơ chế cụ thể được chốt trong `research.md`)
  3. `applicationRepository.cancelApplicationWithStatus(applicationId, actualStatus, tx)` — cập nhật có điều kiện theo trạng thái cụ thể
  4. `eventRepository.decrementApprovedParticipants(eventId, tx)` — nếu actualStatus là APPROVED
  5. `applicationRepository.findByIdAfterUpdate(applicationId, tx)` — đọc lại dữ liệu sau cập nhật
- **Nguyên tắc kiểm tra trong transaction**: Service có thể kiểm tra sơ bộ bên ngoài transaction để trả lỗi sớm (fast-fail). Tuy nhiên, bên trong transaction phải đọc lại dữ liệu mới nhất từ database (qua Repository) và kiểm tra lại toàn bộ điều kiện: đơn còn tồn tại, đơn thuộc về người gửi yêu cầu, đơn đang ở trạng thái `PENDING` hoặc `APPROVED`, sự kiện có trạng thái `PUBLISHED`, sự kiện chưa đến thời gian bắt đầu. Chỉ sau khi kiểm tra lại đầy đủ mới thực hiện cập nhật.
- **Nguyên tắc cập nhật có điều kiện theo trạng thái cụ thể**: Trạng thái dùng để cập nhật Application phải khớp chính xác với trạng thái vừa đọc được bên trong transaction. Nếu đọc được `PENDING`, chỉ cập nhật với điều kiện `status = PENDING`. Nếu đọc được `APPROVED`, chỉ cập nhật với điều kiện `status = APPROVED`. Tuyệt đối không dùng điều kiện `status IN ('PENDING', 'APPROVED')` sau khi đã đọc và ghi nhận một trạng thái cụ thể. Nếu cập nhật có điều kiện trả về `count = 0`, dừng transaction và trả HTTP 409 — không tiếp tục xử lý dựa trên dữ liệu cũ.
- **Bảo vệ Event khỏi thay đổi đồng thời**: Tại thời điểm Application được chuyển sang `CANCELLED`, hệ thống phải bảo đảm Event vẫn có `status = PUBLISHED` và `startDate > now`. Nếu Event đã thay đổi hoặc đã bắt đầu trong lúc request đang xử lý, transaction phải dừng và trả HTTP 409. Cơ chế chính xác (row-level lock, kiểm tra có điều kiện, hoặc chiến lược tương đương được MySQL/Prisma hỗ trợ) sẽ được nghiên cứu và chốt trong `research.md`. Cơ chế này được đặt trong `EventRepository.findEligibleEventForCancellation(eventId, now, tx)`, không để Service tự thao tác.
- **Xử lý Staff duyệt và Volunteer hủy đồng thời**: Khi cập nhật có điều kiện thất bại vì trạng thái đã thay đổi (count = 0), transaction dừng và trả HTTP 409. Người dùng có thể gửi lại yêu cầu hủy; lần tiếp theo hệ thống sẽ đọc trạng thái mới và xử lý đúng quy tắc. Phương án này tránh vòng lặp phức tạp trong cùng một request, đồng thời đảm bảo an toàn dữ liệu.
- `ApplicationRepository` mở rộng với: `findById(id)` (lấy đơn kèm event, dùng cho fast-fail bên ngoài transaction), `findByIdInTransaction(id, tx)` (đọc lại Application trong transaction để lấy trạng thái mới nhất), `cancelApplicationWithStatus(id, expectedStatus, tx)` (cập nhật status = CANCELLED với điều kiện `id = :id AND status = :expectedStatus`, sử dụng `updateMany`; trả về `{ count }` để Service kiểm tra thành công hay thất bại), `findByIdAfterUpdate(id, tx)` (đọc lại Application sau khi cập nhật để lấy `id, status, updatedAt` cho response).
- `EventRepository` mở rộng với: `findByIdInTransaction(eventId, tx)` (đọc lại Event trong transaction), `findEligibleEventForCancellation(eventId, now, tx)` (kiểm tra Event tồn tại, có status = PUBLISHED, startDate > now, và sử dụng cơ chế chống thay đổi đồng thời được chốt trong `research.md`), `decrementApprovedParticipants(eventId, tx)` (giảm approvedParticipants đi 1 với điều kiện > 0, trong transaction context; nếu giá trị đang = 0, không giảm, không throw).
- Frontend: Tận dụng trang EventDetailPage hiện có (UC09), thêm nút "Hủy đơn" khi Volunteer có application ở trạng thái PENDING hoặc APPROVED. Kèm confirm dialog để tránh hủy nhầm (SC-005).
- KHÔNG cần route mới trên frontend vì chức năng hủy được tích hợp vào trang EventDetail hiện tại.

## Theo Dõi Độ Phức Tạp

> **Không có vi phạm Constitutional Check nào — bảng này để trống.**

| Vi Phạm | Lý Do Cần Thiết | Giải Pháp Đơn Giản Hơn Bị Từ Chối Vì |
|---------|----------------|--------------------------------------|
| *(Không có)* | | |

## Các Pha Triển Khai

### Phase 0: Nghiên Cứu & Xác Minh (READ-ONLY)

**Mục Tiêu**: Xác minh schema Prisma hiện có cho Application và Event, xác định chiến lược transaction atomic, cơ chế chống thay đổi Event đồng thời, kiểm tra các ràng buộc dữ liệu và dependency với UC12.

**Nhiệm Vụ**:

1. **Kiểm tra Prisma Schema** — Xác minh model `Application` và `Event`:
   - Application: `status` enum (PENDING, APPROVED, REJECTED, CANCELLED), quan hệ với User và Event
   - Event: `approvedParticipants`, `maxCapacity`, `startDate`, `status` enum (DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED)
   - Xác nhận Application có `userId` và `eventId` foreign keys
   - Xác nhận cascade behavior khi update
   - **Kiểm tra `approvedParticipants`**: Là field được lưu trực tiếp trên bảng Event hay được tính bằng số đơn `APPROVED`? Nếu là computed field, chiến lược cập nhật sẽ khác.

2. **Nghiên cứu chiến lược Transaction** — Prisma interactive transaction với callback API:
   - `ApplicationService` mở transaction: `prisma.$transaction(async (tx) => { ... })`
   - **Không để Service gọi trực tiếp Prisma model** (`tx.application`, `tx.event`, v.v.). Mọi thao tác dữ liệu đều qua Repository.
   - **Fast-fail bên ngoài transaction** (trả lỗi sớm, không tốn tài nguyên transaction):
     - Tìm application theo id, kèm event (qua `applicationRepository.findById(id)` dùng `prisma` thường)
     - Kiểm tra application tồn tại (404 nếu không)
     - Kiểm tra application.userId === userId (403 nếu không)
     - Kiểm tra sơ bộ application.status IN ('PENDING', 'APPROVED') (409 nếu không)
     - Kiểm tra sơ bộ event.status === 'PUBLISHED' (409 nếu không)
     - Kiểm tra sơ bộ event.startDate > now (409 nếu không)
   - **Bên trong transaction** (đọc lại dữ liệu mới nhất qua Repository, kiểm tra lại, cập nhật có điều kiện theo trạng thái cụ thể):
     - Bước 1: Gọi `applicationRepository.findByIdInTransaction(applicationId, tx)` — lấy trạng thái mới nhất, lưu vào biến `actualStatus`, đồng thời lấy `eventId`
     - Bước 2: Kiểm tra lại application vẫn tồn tại và thuộc về userId
     - Bước 3: Kiểm tra `actualStatus` là `PENDING` hoặc `APPROVED` — nếu không, trả 409
     - Bước 4: Gọi `eventRepository.findEligibleEventForCancellation(eventId, now, tx)` — kiểm tra Event tồn tại, status = PUBLISHED, startDate > now, và bảo vệ khỏi thay đổi đồng thời (cơ chế chốt trong `research.md`). Nếu không đủ điều kiện, trả 409.
     - Bước 5: Gọi `applicationRepository.cancelApplicationWithStatus(id, actualStatus, tx)` — cập nhật status = CANCELLED với điều kiện `id = :id AND status = :actualStatus` (PENDING cụ thể hoặc APPROVED cụ thể, không dùng `IN`)
     - Bước 6: Kiểm tra `count`:
       - Nếu `count === 0` → trạng thái đã bị thay đổi bởi request khác → **dừng transaction, trả HTTP 409**. Không giảm `approvedParticipants`. Không đọc lại. Phương án đơn giản và an toàn: trả lỗi để người dùng gửi lại yêu cầu; lần sau hệ thống sẽ đọc trạng thái mới và xử lý đúng.
       - Nếu `count === 1` → cập nhật thành công → tiếp tục bước 7
     - Bước 7: Nếu `actualStatus` là `APPROVED`, gọi `eventRepository.decrementApprovedParticipants(eventId, tx)` — giảm 1 với điều kiện `approvedParticipants > 0`. Nếu `approvedParticipants = 0`, không giảm, vẫn cho phép hủy thành công
     - Bước 8: Gọi `applicationRepository.findByIdAfterUpdate(id, tx)` — đọc lại Application để lấy dữ liệu sau cập nhật: `{ id, status, updatedAt }`. Xác nhận status = CANCELLED
     - Bước 9: Nếu bất kỳ thao tác nào trong transaction throw error (lỗi hệ thống), toàn bộ transaction rollback
   - Repository functions nhận `tx` (Prisma transaction client) thay vì `prisma` thông thường
   - **Cách truyền transaction context**: Repository nhận transaction client qua tham số hàm. Service tạo transaction client và truyền vào từng repository method.

3. **Nghiên cứu cơ chế chống thay đổi Event đồng thời** — Khi Application đang được hủy, Event phải được bảo vệ khỏi thay đổi bởi Manager (chuyển IN_PROGRESS, COMPLETED, CANCELLED) hoặc bởi hệ thống (startDate tới hạn). Cần nghiên cứu một trong các hướng sau và chốt trong `research.md`:
   - **Row-level lock trên Event**: Sử dụng `SELECT ... FOR UPDATE` qua Prisma (nếu được hỗ trợ) hoặc raw query trong transaction để khóa bản ghi Event, ngăn Manager thay đổi Event cho đến khi transaction hủy hoàn tất.
   - **Kiểm tra có điều kiện khi đọc Event**: Kết hợp điều kiện `status = PUBLISHED AND startDate > now` ngay trong truy vấn đọc Event. Nếu Event đã thay đổi, truy vấn trả về null hoặc throw.
   - **Optimistic locking trên Event**: Thêm version field và kiểm tra khi cập nhật.
   - **Chiến lược tương đương** được MySQL và Prisma hỗ trợ.
   - Cơ chế được chọn phải đảm bảo: nếu Event không còn `PUBLISHED` hoặc đã đến `startDate`, transaction phải dừng và trả HTTP 409.
   - Cơ chế này được đóng gói trong `EventRepository.findEligibleEventForCancellation(eventId, now, tx)`.

4. **Nghiên cứu chống race condition** — Ba tình huống cần xử lý:
   - **Hai request cùng hủy một đơn**: Trong transaction, đọc lại trạng thái mới nhất thành `actualStatus`. `cancelApplicationWithStatus(id, actualStatus, tx)` dùng `updateMany` với WHERE condition `id = :id AND status = :actualStatus`. Chỉ request nào thực sự cập nhật được (count = 1) mới thành công. Request còn lại thấy count = 0 → trả 409.
   - **Staff duyệt và Volunteer hủy đồng thời**: Đơn ban đầu là `PENDING`.
     - **Hủy hoàn tất trước**: Volunteer cập nhật đơn từ `PENDING` sang `CANCELLED`. Staff cố gắng duyệt đơn nhưng `updateMany` với điều kiện `status = PENDING` trả về `count = 0` → Staff bị từ chối. `approvedParticipants` không thay đổi.
     - **Duyệt hoàn tất trước**: Staff cập nhật đơn từ `PENDING` sang `APPROVED` và tăng `approvedParticipants`. Volunteer đọc lại trong transaction thấy `actualStatus = APPROVED` → cập nhật với điều kiện `status = APPROVED` thành công → giảm `approvedParticipants` đúng 1. Kết quả cuối cùng nhất quán.
   - **Trạng thái thay đổi giữa lúc đọc và cập nhật**: Volunteer đọc được `actualStatus = PENDING`, nhưng Staff đã chuyển đơn thành `APPROVED` giữa lúc đó. Volunteer gọi `cancelApplicationWithStatus(id, 'PENDING', tx)` → `updateMany` trả về `count = 0`. Hệ thống dừng transaction và trả HTTP 409. Volunteer có thể gửi lại yêu cầu; lần sau sẽ đọc trạng thái mới là `APPROVED` và xử lý đúng quy tắc. Phương án này đơn giản và an toàn, tránh vòng lặp phức tạp.
   - **Event thay đổi giữa lúc đọc và cập nhật**: Event có thể chuyển khỏi `PUBLISHED` hoặc đến `startDate` sau bước kiểm tra fast-fail nhưng trước khi Application được cập nhật. `findEligibleEventForCancellation` sử dụng cơ chế chốt trong `research.md` để bảo đảm Event vẫn đủ điều kiện tại thời điểm hủy.
   - **Nghiên cứu cách dùng `updateMany` với Prisma và MySQL**: `updateMany` trả về `{ count }` (số bản ghi được cập nhật). Không trả về dữ liệu bản ghi. Sau khi cập nhật thành công, phải đọc lại Application bằng `findUnique` (qua Repository) trong cùng transaction để lấy `id, status, updatedAt`.

5. **Xác minh Auth Middleware** — Kiểm tra `auth.middleware.js`:
   - Đã có `authenticate` (bắt buộc) — phù hợp vì chỉ Volunteer đăng nhập mới hủy được
   - Đã có `authorize('VOLUNTEER')` — đảm bảo chỉ Volunteer mới truy cập
   - `req.user.id` chứa userId sau khi authenticate

6. **Nghiên cứu error cases** — Tất cả các tình huống lỗi cần xử lý:
   - 400: ID đơn không hợp lệ (Zod validation fail)
   - 401: Không đăng nhập
   - 403: Không phải Volunteer / không phải chủ đơn
   - 404: Đơn không tồn tại
   - 409: Đơn không ở trạng thái PENDING/APPROVED (REJECTED, CANCELLED, hoặc đã bị thay đổi bởi request khác)
   - 409: Sự kiện đã bắt đầu (startDate <= now)
   - 409: Sự kiện không ở trạng thái PUBLISHED (DRAFT, PENDING_APPROVAL, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED)
   - 409: Event bị thay đổi trạng thái giữa lúc xử lý hủy (không còn PUBLISHED hoặc đã đến startDate)
   - 500: Lỗi transaction / lỗi hệ thống

7. **Kiểm tra luồng Staff duyệt Application** — Xác minh service và repository đang xử lý thao tác Staff duyệt Application:
   - Kiểm tra thao tác duyệt có cập nhật có điều kiện `id = :id AND status = PENDING` hay không.
   - Nếu thao tác duyệt không kiểm tra trạng thái hiện tại, Staff có thể vô tình chuyển `CANCELLED → APPROVED` hoặc `REJECTED → APPROVED`. Ghi nhận đây là dependency hoặc lỗi cần phối hợp sửa.
   - Nếu luồng Staff duyệt thuộc module hoặc UC khác, UC14 chỉ ghi nhận dependency và yêu cầu test tích hợp, không tự mở rộng phạm vi quá mức.
   - Yêu cầu: Staff không được duyệt Application đã `CANCELLED`.

8. **Kiểm tra ảnh hưởng của `@@unique([userId, eventId])` đối với UC12**:
   - Schema hiện tại có `@@unique([userId, eventId])` trên bảng Application.
   - Khi một đơn chuyển sang `CANCELLED`, bản ghi vẫn tồn tại, giữ cặp `userId + eventId` trong unique index.
   - UC12 (Create Application) nếu dùng `create()` để tạo bản ghi mới với cùng `userId` và `eventId` sẽ gặp lỗi Prisma `P2002` (unique constraint violation).
   - **Cần xác minh**: UC12 hiện tạo Application như thế nào? Có kiểm tra và xử lý trường hợp đơn cũ `CANCELLED` không?
   - **Nguyên tắc**: Không xóa đơn `CANCELLED`. Không chuyển `CANCELLED` về `PENDING`. Đơn `CANCELLED` phải được giữ lại. Nếu đăng ký lại, nghiệp vụ yêu cầu tạo một đơn mới.
   - **Ghi nhận**: Schema hiện có `@@unique([userId, eventId])`, trong khi nghiệp vụ cho phép tình nguyện viên tạo một đơn mới sau khi đơn cũ đã `CANCELLED`. Đây là xung đột giữa schema và yêu cầu nghiệp vụ. UC14 chỉ ghi nhận dependency này. Việc thay đổi unique constraint hoặc thay đổi quy tắc đăng ký lại phải được xử lý trong UC12 hoặc thiết kế dữ liệu chung. Chức năng đăng ký lại chưa thể xác nhận hoạt động cho đến khi xung đột được giải quyết.

9. **Kiểm tra response convention hiện tại**:
   - Response hiện tại dùng field thời gian nào? `updatedAt`, `updated_at`, hay tên khác?
   - Kiểm tra response convention của dự án có bắt buộc trả về `eventId` và `userId` trong response không.
   - Dự kiến response: `{ id, status: "CANCELLED", updatedAt }` — phù hợp với schema, không thêm field mới.

10. **Kiểm tra các hàm hiện có trong repository**:
    - `application.repository.js`: Liệt kê tất cả hàm hiện có (hiện chỉ có `findByUserAndEvent`).
    - `event.repository.js`: Liệt kê tất cả hàm hiện có, đặc biệt các hàm cập nhật `approvedParticipants`.

11. **Tham khảo API tương tự** — Xem cách UC09 (View Event Detail) tổ chức controller/service/repository để đảm bảo consistency trong cách xử lý lỗi và response format.

**Output**: `research.md` với các quyết định kỹ thuật và kiến trúc đã chốt, bao gồm kết quả kiểm tra unique constraint, chiến lược chống race condition, cơ chế chống thay đổi Event đồng thời, kết quả kiểm tra luồng Staff duyệt, và đề xuất hướng xử lý cho UC12.

---

### Phase 1: Thiết Kế & Hợp Đồng (READ-ONLY)

**Mục Tiêu**: Thiết kế data model cho request/response, định nghĩa API contract, và viết tài liệu hướng dẫn.

**Nhiệm Vụ**:

1. **Data Model** — Thiết kế cấu trúc request/response:
   - **Request**: `PATCH /api/v1/applications/:id/cancel` — không có body (chỉ cần param :id)
   - **Success Response (200)**: `{ success: true, message: "Đơn đăng ký đã được hủy thành công", data: { id, status: "CANCELLED", updatedAt } }`
   - **Cách lấy `updatedAt`**: Sau khi `updateMany` trả về `count = 1`, gọi `applicationRepository.findByIdAfterUpdate(id, tx)` để đọc lại Application trong cùng transaction. Dữ liệu đọc lại gồm `{ id, status, updatedAt }`. `updateMany` chỉ trả về `{ count }`, không trả về bản ghi.
   - **Error Responses**:
     - 400: `{ success: false, message: "ID đơn không hợp lệ", errors: [...] }` (Zod validation)
     - 401: `{ success: false, message: "Vui lòng đăng nhập để thực hiện thao tác này" }`
     - 403: `{ success: false, message: "Bạn không có quyền hủy đơn này" }` (không phải chủ đơn / không phải Volunteer)
     - 404: `{ success: false, message: "Đơn đăng ký không tồn tại" }`
     - 409: `{ success: false, message: "Không thể hủy đơn này vì..." }` (các lý do: đã bị từ chối/đã hủy/sự kiện đã bắt đầu/sự kiện không ở trạng thái PUBLISHED)

2. **API Contracts** — Định nghĩa đầy đủ Swagger JSDoc cho endpoint:
   - HTTP Method: PATCH
   - Path: `/api/v1/applications/:id/cancel`
   - Auth: Required (JWT Cookie — Volunteer only)
   - Success Response (200): `{ success: true, message: "...", data: { id, status: "CANCELLED", updatedAt } }`
   - Error Responses: 400, 401, 403, 404, 409, 500
   - Không có Request Body

3. **Service Contracts** — Định nghĩa interface cho `ApplicationService.cancelApplication(applicationId, userId)`:
   - Input: applicationId (int), userId (int)
   - Output: `{ id, status: "CANCELLED", updatedAt }`
   - **Fast-fail validation (ngoài transaction, qua Repository)**:
     1. Gọi `applicationRepository.findById(applicationId)` để lấy đơn kèm event (dùng `prisma` thường)
     2. Kiểm tra application tồn tại → 404 nếu không
     3. Kiểm tra `application.userId === userId` → 403 nếu không
     4. Kiểm tra sơ bộ `application.status IN ('PENDING', 'APPROVED')` → 409 nếu không
     5. Kiểm tra sơ bộ `event.status === 'PUBLISHED'` → 409 nếu không
     6. Kiểm tra sơ bộ `event.startDate > now` → 409 nếu không
   - **Transaction (trong `prisma.$transaction(async (tx) => { ... })`, mọi thao tác dữ liệu qua Repository)**:
     7. Gọi `applicationRepository.findByIdInTransaction(applicationId, tx)` — lấy trạng thái mới nhất
        - Gán `actualStatus = application.status`
        - Gán `eventId = application.eventId`
     1. Kiểm tra lại application vẫn tồn tại và thuộc về userId
     2. Kiểm tra `actualStatus IN ('PENDING', 'APPROVED')` — nếu không, trả 409
     3. Gọi `eventRepository.findEligibleEventForCancellation(eventId, now, tx)` — kiểm tra Event tồn tại, status = PUBLISHED, startDate > now, và sử dụng cơ chế chống thay đổi đồng thời (chốt trong `research.md`). Nếu không đủ điều kiện, trả 409.
     4. Gọi `applicationRepository.cancelApplicationWithStatus(applicationId, actualStatus, tx)` — cập nhật status = CANCELLED với điều kiện `id = :id AND status = :actualStatus` (PENDING cụ thể hoặc APPROVED cụ thể, không dùng `IN`)
     5. Nếu `count === 0` → dừng transaction, trả HTTP 409 (trạng thái đã bị thay đổi bởi request khác, người dùng nên gửi lại yêu cầu)
     6. Nếu `actualStatus === 'APPROVED'` và `count === 1`:
         - Gọi `eventRepository.decrementApprovedParticipants(eventId, tx)` — giảm 1 với điều kiện `approvedParticipants > 0`
         - Nếu `approvedParticipants = 0`, không giảm, vẫn hủy thành công (không rollback)
     7. Gọi `applicationRepository.findByIdAfterUpdate(applicationId, tx)` — đọc lại Application sau cập nhật. Xác nhận status = CANCELLED
     8. Commit transaction, trả về `{ id, status, updatedAt }` từ dữ liệu đọc lại ở bước 14
   - Nếu bất kỳ thao tác nào trong transaction throw error (lỗi hệ thống: mất kết nối DB, lỗi Prisma, ...), toàn bộ transaction rollback. Application không đổi trạng thái.

4. **Quick Start Guide** — Hướng dẫn developer chạy và test feature:
   - Cách seed dữ liệu test: tạo application PENDING, APPROVED, REJECTED cho test
   - Cách test API bằng Swagger UI
   - Cách test frontend: đăng nhập Volunteer → vào EventDetail → thấy nút Hủy
   - Cách test race condition: gửi 2 request PATCH đồng thời cho cùng application
   - Cách test Staff duyệt và Volunteer hủy đồng thời
   - Cách test Event thay đổi đồng thời

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Lập Kế Hoạch Triển Khai (READY FOR APPROVAL)

**Mục Tiêu**: Chia nhỏ công việc thành các task nguyên tử, có thứ tự phụ thuộc rõ ràng.

**Lưu Ý**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve.

**Dự Kiến Output**: `tasks.md` với atomic task breakdown:

- **Backend Tasks** (theo thứ tự phụ thuộc):
  1. **Nghiên cứu unique constraint, cơ chế chống Event thay đổi, và luồng Staff duyệt** — Kiểm tra UC12 xử lý đơn CANCELLED như thế nào, ghi nhận dependency. Nghiên cứu cơ chế chống thay đổi Event đồng thời (row-level lock hoặc tương đương). Kiểm tra luồng Staff duyệt có cập nhật theo điều kiện `status = PENDING` hay không. Không tự ý thay đổi schema. Không đề xuất xóa đơn cũ.
  2. Mở rộng `application.repository.js` — Thêm:
     - `findById(id)` — lấy đơn kèm event, dùng cho fast-fail bên ngoài transaction
     - `findByIdInTransaction(id, tx)` — đọc lại Application trong transaction để lấy trạng thái mới nhất (dùng `tx.application.findUnique` — code bên trong Repository, không phải Service)
     - `cancelApplicationWithStatus(id, expectedStatus, tx)` — cập nhật status = CANCELLED với điều kiện `id = :id AND status = :expectedStatus` (PENDING hoặc APPROVED cụ thể, không dùng `IN`). Trả về `{ count }` từ `updateMany` (dùng `tx.application.updateMany` — code trong Repository). Kiểm tra `count > 0` để xác nhận cập nhật thành công.
     - `findByIdAfterUpdate(id, tx)` — đọc lại Application sau cập nhật, trả về `{ id, status, updatedAt }` (dùng `select` trong `tx.application.findUnique` — code trong Repository)
  3. Mở rộng `event.repository.js` — Thêm:
     - `findByIdInTransaction(eventId, tx)` — đọc lại Event trong transaction
     - `findEligibleEventForCancellation(eventId, now, tx)` — kiểm tra Event tồn tại, có status = PUBLISHED, startDate > now, và sử dụng cơ chế chống thay đổi đồng thời được chốt trong `research.md`. Nếu không đủ điều kiện, throw lỗi để Service bắt và trả 409.
     - `decrementApprovedParticipants(eventId, tx)` — giảm approvedParticipants đi 1 với điều kiện `> 0`. Nếu `approvedParticipants = 0`, không giảm, không throw error, vẫn hủy thành công
  4. Tạo `application.validator.js` — Zod schema validate `:id` param (positive integer)
  5. Tạo `application.service.js` — Business logic:
     - Fast-fail validation ngoài transaction qua Repository (ownership, status, event timing)
     - Mở `prisma.$transaction(async (tx) => ...)`
     - Trong transaction: mọi thao tác dữ liệu đều qua Repository (không gọi trực tiếp `tx.application` hay `tx.event`)
     - Trình tự trong transaction:
       1. `applicationRepository.findByIdInTransaction(applicationId, tx)` → `actualStatus`, `eventId`
       2. Kiểm tra lại quyền sở hữu và trạng thái
       3. `eventRepository.findEligibleEventForCancellation(eventId, now, tx)`
       4. `applicationRepository.cancelApplicationWithStatus(applicationId, actualStatus, tx)`
       5. Nếu `count = 0`, dừng và trả HTTP 409
       6. Nếu `actualStatus === 'APPROVED'`, `eventRepository.decrementApprovedParticipants(eventId, tx)`
       7. `applicationRepository.findByIdAfterUpdate(applicationId, tx)` → response data
     - Xử lý Staff duyệt và Volunteer hủy đồng thời: nếu count = 0, trả 409 và để người dùng gửi lại
     - Xử lý Event thay đổi đồng thời: nếu `findEligibleEventForCancellation` thất bại, trả 409
     - Chỉ rollback khi có lỗi hệ thống thực sự
  6. Tạo `application.controller.js` — Xử lý request, gọi service, format response theo ADR-006
  7. Tạo `application.routes.js` — Định nghĩa route PATCH `/api/v1/applications/:id/cancel` với auth + validator
  8. Cập nhật `app.js` — Mount application routes
  9. Viết `application.service.test.js` — Unit test (>80% coverage: happy path + tất cả error cases + test rollback khi Event update thất bại + test `approvedParticipants = 0` không bị rollback + test response có `updatedAt`)
  10. Viết `application.cancel.test.js` — Integration test:
      - Happy path: hủy PENDING, hủy APPROVED
      - Error cases: unauthorized, not owner, already rejected, already cancelled, event started, event không PUBLISHED
      - **Response sau khi hủy thành công**: `id`, `status = CANCELLED`, `updatedAt` (không có `cancelledAt`)
      - **Hai request cùng hủy một đơn APPROVED**: Gửi 2 request đồng thời → chỉ 1 nhận 200, 1 nhận 409, status cuối = CANCELLED, approvedParticipants chỉ giảm đúng 1
      - **Staff duyệt và Volunteer hủy đồng thời (hủy trước, duyệt sau)**: Hủy hoàn tất trước → đơn CANCELLED → Staff không duyệt được → approvedParticipants không đổi
      - **Staff duyệt và Volunteer hủy đồng thời (duyệt trước, hủy sau)**: Duyệt hoàn tất trước → đơn APPROVED → hủy tiếp tục xử lý như APPROVED → đơn CANCELLED → approvedParticipants giảm đúng 1
      - **Staff đổi PENDING thành APPROVED giữa lúc Volunteer đọc và cập nhật**: Volunteer đọc `PENDING`, Staff duyệt thành `APPROVED`, Volunteer cập nhật với điều kiện `status = PENDING` → `count = 0` → trả HTTP 409 → Volunteer không giảm `approvedParticipants` → dữ liệu không sai lệch
      - **Gửi lại yêu cầu sau khi Staff đã duyệt**: Đơn hiện là `APPROVED` → Volunteer gửi lại → hệ thống đọc `APPROVED` → hủy thành công → giảm `approvedParticipants` đúng 1
      - **Staff không thể duyệt Application đã CANCELLED**: Volunteer hủy thành công → Staff cố duyệt cùng đơn → thất bại → đơn vẫn CANCELLED → approvedParticipants không tăng
      - **Event chuyển khỏi PUBLISHED giữa lúc xử lý hủy**: Event PUBLISHED → Volunteer bắt đầu hủy → Manager chuyển Event sang IN_PROGRESS/COMPLETED/CANCELLED → yêu cầu hủy thất bại với HTTP 409 → Application giữ nguyên trạng thái → approvedParticipants không thay đổi
      - **Event bắt đầu giữa lúc xử lý hủy**: Event chưa bắt đầu → Volunteer bắt đầu hủy → startDate <= now tại thời điểm kiểm tra cuối cùng → yêu cầu hủy thất bại với HTTP 409 → Application giữ nguyên trạng thái → approvedParticipants không thay đổi
      - **Application và Event cùng thay đổi đồng thời**: Hệ thống không tiếp tục dựa trên dữ liệu cũ → kết quả cuối cùng nhất quán → không giảm approvedParticipants nếu hủy Application không thành công
      - **approvedParticipants = 0**: Đơn APPROVED, event có approvedParticipants = 0 → hủy thành công (200) → đơn CANCELLED → approvedParticipants vẫn = 0
      - **Rollback khi lỗi DB thực sự**: Mô phỏng lỗi khi cập nhật Event → transaction rollback → Application không đổi trạng thái → Event không đổi dữ liệu

- **Frontend Tasks** (sau khi Backend hoàn thành):
  11. Tạo `application.service.js` — Axios API call PATCH /api/v1/applications/:id/cancel với error handling
  12. Cập nhật `EventDetailPage.jsx` — Thêm nút "Hủy đơn" khi user có application PENDING/APPROVED, kèm MUI Dialog xác nhận (SC-005)
  13. Viết `CancelApplication.test.jsx` — Component test (hiển thị nút hủy, confirm dialog, success state, error states)

**Phụ Thuộc**: Backend task 2→3→5→6→7→8 (repository → service → controller → routes → app mount, với 3 là EventRepository). Task 4 có thể song song với 2, 3. Frontend task 11→12→13 (service → UI → test).

---

## Đánh Giá Rủi Ro

### RỦI RO CAO

- **Race Condition khi hủy đơn APPROVED**: Nhiều request hủy cùng lúc có thể gây ra `approvedParticipants` bị sai lệch hoặc giảm nhiều lần cho cùng một đơn. Rủi ro: Dữ liệu không nhất quán, capacity vượt quá thực tế.
  - **Giảm thiểu**: Sử dụng Prisma interactive transaction API (`$transaction` với callback). Trong transaction, đọc lại trạng thái mới nhất qua `applicationRepository.findByIdInTransaction` thành `actualStatus`. `cancelApplicationWithStatus(id, actualStatus, tx)` dùng `updateMany` với WHERE condition `id = :id AND status = :actualStatus` (PENDING hoặc APPROVED cụ thể). Chỉ request đầu tiên có `count = 1`. Transaction đảm bảo cả hai thay đổi cùng thành công hoặc cùng rollback.

- **Event thay đổi đồng thời trong lúc hủy**: Event có thể chuyển khỏi `PUBLISHED` hoặc đến thời gian bắt đầu sau bước kiểm tra fast-fail nhưng trước khi Application được cập nhật. Rủi ro: Hủy Application thành công khi Event không còn đủ điều kiện, vi phạm Domain Rule FR-005.
  - **Giảm thiểu**: Sử dụng cơ chế chống thay đổi đồng thời được chốt trong `research.md` (row-level lock trên Event, kiểm tra có điều kiện trong truy vấn đọc Event, hoặc optimistic locking). Cơ chế này được đóng gói trong `eventRepository.findEligibleEventForCancellation(eventId, now, tx)`. Nếu Event không còn `PUBLISHED` hoặc đã đến `startDate`, transaction dừng và trả HTTP 409. Không hủy Application, không giảm `approvedParticipants`.

- **Staff duyệt và Volunteer hủy đồng thời**: Đơn `PENDING` có thể bị Staff duyệt và Volunteer hủy gần như cùng lúc. Rủi ro: Đơn `CANCELLED` nhưng `approvedParticipants` không được điều chỉnh đúng, hoặc Staff duyệt được đơn đã hủy.
  - **Giảm thiểu**: Cập nhật có điều kiện theo trạng thái cụ thể (không dùng `IN`). Nếu Volunteer đọc được `PENDING` nhưng Staff đã duyệt thành `APPROVED`, `updateMany` với điều kiện `status = PENDING` trả về `count = 0` → dừng transaction, trả HTTP 409. Người dùng gửi lại, hệ thống đọc trạng thái mới là `APPROVED` và xử lý đúng. Phương án đơn giản và an toàn. Staff chỉ duyệt được nếu trạng thái vẫn là `PENDING`. Có integration test xác nhận Staff không thể duyệt Application đã CANCELLED.

- **Vi phạm Domain Rule "Không hủy khi sự kiện đã bắt đầu"**: Nếu kiểm tra `startDate > now` không chính xác (timezone, clock skew). Rủi ro: Cho phép hủy đơn khi sự kiện đã bắt đầu, vi phạm business rule.
  - **Giảm thiểu**: So sánh `event.startDate` với `new Date()` trên server. Dùng UTC cho tất cả timestamp. Kiểm tra lại `startDate` bên trong transaction qua `eventRepository.findEligibleEventForCancellation` với cơ chế chống thay đổi đồng thời để tránh TOCTOU (Time-of-check to time-of-use).

### RỦI RO TRUNG BÌNH

- **Transaction rollback khi cập nhật Event gặp lỗi hệ thống**: Nếu `decrementApprovedParticipants` gặp lỗi DB thực sự (mất kết nối, lock timeout, ...), Application đã được cập nhật status = CANCELLED trước đó có thể không được rollback nếu transaction không tổ chức đúng. Rủi ro: Trạng thái đơn và số người đã được duyệt không đồng bộ.
  - **Giảm thiểu**: Hai thay đổi phải nằm trong cùng `prisma.$transaction` callback. Nếu bất kỳ thao tác nào throw error (lỗi hệ thống), toàn bộ transaction rollback. Phải có integration test mô phỏng lỗi khi cập nhật Event sau khi đã cập nhật Application để xác minh rollback hoạt động.
  - **Lưu ý**: `approvedParticipants = 0` không phải là lỗi hệ thống và không gây rollback. Trường hợp này vẫn cho phép hủy thành công, giữ nguyên giá trị 0.

- **Unique constraint `@@unique([userId, eventId])` chặn đăng ký lại**: Bản ghi `CANCELLED` vẫn giữ cặp `userId + eventId` trong unique index, nên UC12 có thể không tạo được đơn mới và trả lỗi `P2002` (unique constraint violation). Schema hiện có `@@unique([userId, eventId])`, trong khi nghiệp vụ cho phép tình nguyện viên tạo một đơn mới sau khi đơn cũ đã `CANCELLED`. Đây là xung đột giữa schema và yêu cầu nghiệp vụ.
  - **Giảm thiểu**: UC14 không tự thay đổi schema vì việc đăng ký lại thuộc UC12. Không xóa đơn `CANCELLED`. Không chuyển `CANCELLED` về `PENDING`. Plan ghi nhận đây là dependency cần giải quyết trước khi xác nhận chức năng đăng ký lại hoạt động. Phase 0 sẽ nghiên cứu cách UC12 hiện xử lý và đề xuất hướng giải quyết trong `research.md`. Việc thay đổi unique constraint hoặc thay đổi quy tắc đăng ký lại phải được xử lý trong UC12 hoặc thiết kế dữ liệu chung.

- **Staff approval không kiểm tra trạng thái Application**: Nếu thao tác duyệt của Staff không yêu cầu Application vẫn là `PENDING`, Staff có thể vô tình duyệt một đơn đã `CANCELLED` hoặc `REJECTED`. Rủi ro: Application chuyển từ `CANCELLED` sang `APPROVED`, `approvedParticipants` tăng không đúng, vi phạm state machine một chiều.
  - **Giảm thiểu**: Phase 0 sẽ kiểm tra service và repository đang xử lý thao tác Staff duyệt Application. Thao tác duyệt phải cập nhật có điều kiện `id = :id AND status = PENDING`. Có integration test xác nhận Staff không thể duyệt Application đã `CANCELLED`. Nếu luồng duyệt thuộc module khác, UC14 ghi nhận dependency và yêu cầu phối hợp sửa.

- **Application module chưa tồn tại**: Hiện tại `application.repository.js` chỉ có 1 hàm `findByUserAndEvent`. Cần tạo mới toàn bộ controller, service, routes. Rủi ro: Xung đột với module của member khác.
  - **Giảm thiểu**: Theo AGENTS.md, CuongLH phụ trách module Application/Event. Nếu đúng, không có xung đột. Nếu không, cần sync với chủ module. Kiểm tra `share_context.md` để xác nhận.

- **Frontend chưa có trang quản lý đơn đăng ký riêng**: Nút "Hủy đơn" được thêm vào EventDetailPage (UC09). Nếu chưa có UC09, cần phối hợp. Rủi ro: Dependency chưa sẵn sàng.
  - **Giảm thiểu**: UC09 (View Event Detail) đã có plan đầy đủ và đang được triển khai. UC14 chỉ thêm nút Hủy + dialog.

### RỦI RO THẤP

- **Volunteer cố tình hủy đơn nhiều lần**: Gửi nhiều request PATCH liên tiếp. Rủi ro: Request thứ 2 sẽ fail vì status đã là CANCELLED.
  - **Giảm thiểu**: Service layer kiểm tra `application.status IN ('PENDING', 'APPROVED')` — nếu đã CANCELLED, trả 409. Idempotency tự nhiên.

---

## Danh Sách Kiểm Tra Trước Triển Khai

Trước khi merge vào nhánh chính:

- [ ] Tất cả unit tests passing (>80% coverage cho ApplicationService)
- [ ] Tất cả integration tests passing (happy path + tất cả error cases: SC-001 đến SC-004)
- [ ] Integration test: hai request hủy đồng thời → chỉ 1 thành công, approvedParticipants chỉ giảm 1
- [ ] Integration test: Staff duyệt và Volunteer hủy đồng thời (hủy trước) → hủy thành công, Staff không duyệt được, approvedParticipants không đổi
- [ ] Integration test: Staff duyệt và Volunteer hủy đồng thời (duyệt trước) → hủy thành công, approvedParticipants giảm đúng 1
- [ ] Integration test: Staff đổi PENDING thành APPROVED giữa lúc Volunteer đọc và update → Volunteer nhận 409, không giảm approvedParticipants
- [ ] Integration test: Gửi lại sau khi Staff duyệt → đọc APPROVED → hủy thành công → giảm approvedParticipants
- [ ] Integration test: Staff không thể duyệt Application đã CANCELLED
- [ ] Integration test: Event chuyển khỏi PUBLISHED giữa lúc xử lý → hủy thất bại HTTP 409, Application không đổi, approvedParticipants không đổi
- [ ] Integration test: Event bắt đầu giữa lúc xử lý → hủy thất bại HTTP 409, Application không đổi, approvedParticipants không đổi
- [ ] Integration test: Application và Event cùng thay đổi đồng thời → kết quả nhất quán, không sai lệch dữ liệu
- [ ] Integration test: `approvedParticipants = 0` → hủy vẫn thành công (200), giá trị giữ nguyên 0
- [ ] Integration test: mô phỏng lỗi DB khi cập nhật Event → transaction rollback, Application không đổi trạng thái
- [ ] Integration test: response sau hủy thành công có `id`, `status = CANCELLED`, `updatedAt`; không có `cancelledAt`
- [ ] Component test passing (SC-005: confirm dialog hiển thị đúng)
- [ ] Swagger JSDoc đầy đủ cho PATCH /api/v1/applications/:id/cancel
- [ ] Không có lỗi linting (`npm run lint` pass ở cả backend và frontend)
- [ ] Auth middleware hoạt động đúng: 401 nếu không đăng nhập, 403 nếu không phải Volunteer
- [ ] Transaction atomicity: nếu cập nhật Event gặp lỗi hệ thống, Application không đổi trạng thái
- [ ] Application không dùng `status IN ('PENDING', 'APPROVED')` trong thao tác cập nhật cuối cùng; dùng `status = actualStatus` (PENDING hoặc APPROVED cụ thể)
- [ ] Response format tuân thủ ADR-006: `{ success, message, data, errors }`
- [ ] Response data: `{ id, status: "CANCELLED", updatedAt }` — không có `cancelledAt`, không có field thừa
- [ ] Sau khi `updateMany` thành công, đọc lại Application qua `applicationRepository.findByIdAfterUpdate` trong transaction để lấy `updatedAt`
- [ ] `ApplicationService` không gọi trực tiếp bất kỳ Prisma model operation nào (`tx.application`, `tx.event`, v.v.). Mọi thao tác dữ liệu đều qua Repository.
- [ ] `eventRepository.findEligibleEventForCancellation` sử dụng cơ chế chống thay đổi đồng thời được chốt trong `research.md`
- [ ] `approvedParticipants` không bao giờ < 0 sau khi hủy (SC-003)
- [ ] Hủy PENDING không làm thay đổi `approvedParticipants` (SC-002)
- [ ] Chỉ hủy được khi event.status = PUBLISHED (FR-005) — kiểm tra lại trong transaction qua `findEligibleEventForCancellation`
- [ ] Kiểm tra lại quyền sở hữu và trạng thái bên trong transaction với dữ liệu mới nhất (qua Repository, không qua Prisma model trực tiếp)
- [ ] Trạng thái dùng để cập nhật (`actualStatus`) là trạng thái đọc trong transaction, không phải trạng thái đọc trước transaction
- [ ] Nếu `count = 0` sau `updateMany`, dừng transaction và trả 409 — không giảm `approvedParticipants`, không tiếp tục dựa trên dữ liệu cũ
- [ ] Không expose dữ liệu nhạy cảm trong response
- [ ] Confirm dialog có đủ thông tin (tên sự kiện, trạng thái đơn) trước khi hủy (SC-005)
- [ ] Đã xóa tất cả comments `TODO`/`FIXME`
- [ ] Đã chạy `detect_changes()` để xác minh chỉ các file dự kiến bị ảnh hưởng
- [ ] Đã xác minh dependency với UC12: ghi nhận kết quả kiểm tra unique constraint trong research.md
- [ ] Đã xác minh luồng Staff duyệt Application: thao tác duyệt phải có điều kiện `status = PENDING`

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

1. **Chủ sở hữu Module Application**: ✅ ĐÃ XÁC NHẬN — CuongLH là chủ sở hữu module Application. UC14 mở rộng repository này và tạo mới toàn bộ application module (controller, service, routes). Không có xung đột với member khác.

2. **Tích hợp Frontend với UC09**: ✅ ĐÃ CHỐT — **Phương án (C): Tích hợp song song**. Backend UC14 làm trước (không phụ thuộc UC09). Frontend thêm nút "Hủy đơn" vào EventDetailPage ngay khi UC09 có code cơ bản. UC14 chỉ thêm 1 nút + dialog đơn giản, không xâm phạm logic cốt lõi của UC09.

3. **Xử lý trường hợp sự kiện không ở trạng thái PUBLISHED**: ✅ ĐÃ CHỐT — UC14 chỉ cho phép hủy khi sự kiện có trạng thái `PUBLISHED` và chưa đến thời gian bắt đầu. Nếu sự kiện có bất kỳ trạng thái nào khác (DRAFT, PENDING_APPROVAL, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED), yêu cầu hủy bị từ chối với HTTP 409. Cơ chế chống thay đổi đồng thời bảo vệ Event khỏi bị Manager thay đổi trong lúc hủy.

---

**Trạng Thái Kế Hoạch**: SẴN SÀNG ĐỂ XEM XÉT  
**Công Sức Ước Tính**: 8-12 giờ (Phân tích: Phase 0: 1.5h, Phase 1: 2h, Phase 2: 4.5-8.5h)  
**Mức Ưu Tiên**: P1 (High — là tính năng cốt lõi cho Volunteer, ảnh hưởng trực tiếp đến capacity management và UX)
