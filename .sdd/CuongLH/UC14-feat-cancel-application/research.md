# Research: UC14 - Cancel Application

**Author:** CuongLH  
**Date:** 2026-07-21  
**Feature:** Volunteer hủy đơn đăng ký sự kiện (Cancel Application)

---

## 1. Kiến trúc hiện tại (Current State)

### 1.1 Schema hiện có

**Model Application** (`backend/prisma/schema.prisma:249-267`):

- Fields: `id`, `userId`, `eventId`, `status` (ApplicationStatus: PENDING|APPROVED|REJECTED|CANCELLED), `message`, `processedBy`, `processedAt`, `createdAt`, `updatedAt`
- Relations: `submittedByUser` (User), `event` (Event), `processedByUser` (User?)
- Index: `[userId, status]`, `[eventId, status]`, `[processedBy]`

**Model Event** (`backend/prisma/schema.prisma:208-242`):

- Fields: `id`, `status` (EventStatus), `startDate`, `endDate`, `applicationDeadline`, `maxCapacity`, `approvedParticipants`, `isActive`
- Status enum: DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED

### 1.2 Repository hiện có

**application.repository.js** (`backend/src/repositories/application.repository.js`):

- Chỉ có 1 function: `findByUserAndEvent(userId, eventId)` - tìm application không bị CANCELLED
- **Chưa có**: `update`, `create`, `findById`, `findByUserAndEventWithEvent`

**event.repository.js** (`backend/src/repositories/event.repository.js`):

- Chỉ có 1 function: `findByIdWithRelations(eventId)` - tìm event active với status PUBLISHED|IN_PROGRESS|COMPLETED
- **Chưa có**: `decrementApprovedParticipants`, `update`, `findById`

### 1.3 Middleware Auth hiện có

**auth.middleware.js** (`backend/src/middlewares/auth.middleware.js`):

- `authMiddleware` (default export): Bắt buộc đăng nhập, kiểm tra JWT, session, active, emailVerified
- `authenticateOptional`: Optional auth, dùng cho endpoint public
- `req.user` chứa: `user_id`, `email`, `role`, `jti` (từ decoded JWT)

### 1.4 Routes / Controller hiện tại

- Chưa có application.routes.js, application.controller.js, application.service.js
- Event routes: `backend/src/routes/event.routes.js` (đã có cho UC09)
- Auth routes: `backend/src/routes/auth.routes.js`

---

## 2. Domain Rules áp dụng cho Cancel Application

Từ **AGENTS.md Section 3**:

### Application Rules
>
> **Rule 1**: Đơn đăng ký đã chuyển sang `Approved` hoặc `Rejected` thì TUYỆT ĐỐI KHÔNG được quay ngược lại trạng thái `Pending`.
> → **Áp dụng**: Đơn CANCELLED không được quay lại PENDING.

### Event Rules
>
> **Rule 3**: Tình nguyện viên chỉ có thể hủy đăng ký khi sự kiện chưa diễn ra. Đối với no-show, phải xử lý thông qua Điểm danh (Attendance Check), KHÔNG dùng chức năng Hủy đơn.
> → **Áp dụng**: Chỉ cho phép cancel khi `event.startDate > now` (sự kiện chưa bắt đầu).

### Soft Delete Rules
>
> **Rule 2**: Transaction data (Application) → State transition (`status = cancelled`)
> → **Xác nhận**: Cancel Application là state transition (PENDING/APPROVED → CANCELLED), không phải physical delete.

### Capacity Rules
>
> **Rule 1**: `event.approved_participants <= event.max_capacity` luôn phải đúng.
> → **Áp dụng**: Khi cancel application APPROVED → cần giảm `approved_participants`.

---

## 3. Business Logic - Cancel Application Flow

### 3.1 Điều kiện cho phép cancel

| # | Điều kiện | Rationale |
|---|-----------|-----------|
| 1 | Application tồn tại | Phải có đơn đăng ký |
| 2 | Application thuộc về user đang login | Chỉ chủ đơn mới được hủy |
| 3 | Application status = PENDING hoặc APPROVED | Không cancel được REJECTED/CANCELLED |
| 4 | Event chưa bắt đầu (`event.startDate > now`) | Domain Rule Event #3 |
| 5 | Event status hợp lệ (PUBLISHED, IN_PROGRESS chưa start) | Không cancel event đã COMPLETED/CANCELLED |

### 3.2 Hành động khi cancel

**Nếu status = PENDING:**

- Chỉ cần update `status = CANCELLED`
- Không ảnh hưởng `approved_participants`

**Nếu status = APPROVED:**

- Update `status = CANCELLED`
- Giảm `event.approved_participants` đi 1 (atomic decrement)
- Đảm bảo không giảm xuống dưới 0

### 3.3 Dữ liệu trả về

- Application đã updated với status CANCELLED
- Event với approved_participants đã cập nhật (nếu applicable)

---

## 4. Technical Decisions

### 4.1 API Endpoint

```
PATCH /api/v1/applications/:applicationId/cancel
```

- **Tại sao PATCH?** Đây là state transition (partial update), không phải DELETE
- **Tại sao `/applications/:applicationId/cancel`?** RESTful sub-resource action pattern
- **Auth**: Yêu cầu `authMiddleware` (Volunteer role)

### 4.2 Các layer cần tạo mới

| Layer | File mới | Ghi chú |
|-------|----------|---------|
| Repository | `application.repository.js` (mở rộng) | Thêm `findById`, `findByIdWithEvent`, `updateStatus` |
| Repository | `event.repository.js` (mở rộng) | Thêm `decrementApprovedParticipants` |
| Service | `application.service.js` (mới) | Business logic cancel |
| Controller | `application.controller.js` (mới) | Handle HTTP request |
| Routes | `application.routes.js` (mới) | Route definition |
| Validator | `application.validator.js` (mới) | Zod validation |
| App.js | `app.js` (sửa) | Mount application routes |

### 4.3 Cấu trúc thư mục Backend

```
backend/src/
├── controllers/
│   └── application.controller.js  (NEW)
├── services/
│   └── application.service.js     (NEW)
├── repositories/
│   ├── application.repository.js  (EXTEND)
│   └── event.repository.js        (EXTEND)
├── routes/
│   └── application.routes.js      (NEW)
├── middlewares/
│   └── validators/
│       └── application.validator.js (NEW)
└── app.js                          (MODIFY)
```

### 4.4 Transaction Strategy

Sử dụng **Prisma Interactive Transaction** (`prisma.$transaction`) để đảm bảo atomicity:

- Update application status
- Decrement event approved_participants (nếu APPROVED → CANCELLED)
- Nếu 1 trong 2 thất bại → rollback toàn bộ

### 4.5 Error Codes

| HTTP Status | Code | Mô tả |
|-------------|------|-------|
| 400 | VALIDATION_ERROR | Input không hợp lệ |
| 401 | UNAUTHORIZED | Chưa đăng nhập |
| 403 | FORBIDDEN | Không có quyền (không phải chủ đơn) |
| 404 | NOT_FOUND | Application không tồn tại |
| 409 | CONFLICT | Không thể cancel (event đã bắt đầu, status không hợp lệ) |
| 500 | INTERNAL_ERROR | Lỗi server |

### 4.6 Response Format

Tuân thủ `backend/src/utils/response.util.js`:

```js
// Success
successResponse(res, data, message, statusCode)

// Error
errorResponse(message, code)
```

---

## 5. Testing Strategy

### 5.1 Unit Tests (`backend/tests/unit/application.service.test.js`)

- Cancel PENDING application → success
- Cancel APPROVED application → success + decrement approved_participants
- Cancel non-existent application → error
- Cancel application of another user → error
- Cancel already CANCELLED application → error
- Cancel REJECTED application → error
- Cancel when event already started → error
- Cancel when event COMPLETED → error

### 5.2 Integration Tests (`backend/tests/integration/application.test.js`)

- Happy path: Volunteer cancels own PENDING application
- Happy path: Volunteer cancels own APPROVED application
- Auth: Không có token → 401
- Auth: Token của user khác → 403
- Validation: applicationId không hợp lệ → 400
- Edge case: approved_participants không giảm dưới 0

---

## 6. Dependencies

### 6.1 Module Dependencies

- **Auth Module**: `authMiddleware` để xác thực user
- **Event Module**: `event.repository.js` để cập nhật approved_participants
- **Application Module**: Tự chứa (self-contained)

### 6.2 Package Dependencies

- `@prisma/client` (có sẵn)
- `zod` (có sẵn, dùng cho validation)
- `express` (có sẵn)

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition khi decrement approved_participants | Cao | Dùng Prisma transaction + atomic update |
| User cancel sai application | Trung bình | Kiểm tra ownership (userId) |
| approved_participants < 0 | Cao | Check constraint trong transaction |
| Application status transition không hợp lệ | Trung bình | Validate status trước khi update |

---

## 8. References

- **Spec**: `.sdd/CuongLH/UC14-feat-cancel-application/spec.md`
- **Plan**: `.sdd/CuongLH/UC14-feat-cancel-application/plan.md`
- **Context**: `.sdd/CuongLH/UC14-feat-cancel-application/context.md`
- **AGENTS.md**: Domain Rules Section 3
- **Schema**: `backend/prisma/schema.prisma`
- **Existing repos**: `backend/src/repositories/application.repository.js`, `backend/src/repositories/event.repository.js`
- **Auth middleware**: `backend/src/middlewares/auth.middleware.js`
- **Response util**: `backend/src/utils/response.util.js`
