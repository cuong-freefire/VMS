# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

# Implementation Plan: UC15 — Submit Application (Gửi đơn đăng ký)

**Branch**: `feat/submit-application` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification từ `.sdd/CuongLH/UC15-feat-submit-application/spec.md`

**Note**: Template này được fill bởi `/speckit-plan`. Tham khảo `.specify/templates/plan-template.md` cho execution workflow.

---

## Summary

Tính năng cho phép **Volunteer** gửi đơn đăng ký tham gia sự kiện từ một trang riêng biệt (`ApplyEventPage`). Volunteer có thể kèm lời nhắn tùy chọn (tối đa 500 ký tự). Sau khi gửi thành công, đơn được tạo ở trạng thái `PENDING` và chờ Staff/Manager xét duyệt.

**Điểm vào (Entry Point)**: Nút "Đăng ký tham gia" trên `EventDetailPage` → điều hướng đến `/volunteer/events/:id/apply`.

**Backend**: API `POST /api/v1/applications` — xử lý qua Controller → Service → Repository với Prisma transaction, validation Zod, và Swagger doc đầy đủ.

**Frontend**: `ApplyEventPage.jsx` — hiển thị form gửi đơn gồm: thông tin sự kiện, tên người đăng ký, ô nhập lời nhắn. Gọi API qua `applicationService.submitApplication()`.

---

## Technical Context

**Language/Version**: Node.js 20+ (ESM), JavaScript — React 19 (JSX)

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc
- Frontend: React 19, React Router 6, Axios, Material UI, Bootstrap 5, React Toastify, Lucide React

**Storage**: MySQL (qua Prisma ORM, bảng `applications`, `events`)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web application (SPA + REST API)

**Project Type**: Web application (Monorepo: `backend/` + `frontend/`)

**Performance Goals**: < 200ms response time cho mỗi API call

**Constraints**: 
- Atomicity: Dùng Prisma transaction để đảm bảo tính nhất quán khi tạo Application
- Concurrency: Kiểm tra capacity (`approvedParticipants < maxCapacity`) và duplicate check bên trong transaction

**Scale/Scope**: ~5-10 sự kiện active, ~100-500 volunteer đăng ký/sự kiện

---

## Constitution Check

*GATE: Phải pass trước khi Phase 0 research. Re-check sau Phase 1 design.*

| Nguyên tắc | Check | Ghi chú |
|---|---|---|
| Layered Architecture (Controller → Service → Repository) | ✅ PASS | `application.controller.js` → `application.service.js` → `application.repository.js` |
| Business logic trong Service layer | ✅ PASS | Tất cả validation (role check, event status, capacity, duplicate) nằm trong `application.service.js` |
| Prisma ORM only (ADR-001) | ✅ PASS | Repository dùng Prisma transaction client |
| API Style: RESTful `/api/v1/[resource]` | ✅ PASS | `POST /api/v1/applications` |
| Response Format (ADR-006) | ✅ PASS | Dùng `response.util.js` (`successResponse`, `errorResponse`) |
| JWT HttpOnly Cookie Auth | ✅ PASS | `authMiddleware` bảo vệ endpoint |
| Validation Zod | ✅ PASS | `submitApplicationSchema` trong `application.validator.js` |
| Swagger JSDoc | ✅ PASS | Đầy đủ @swagger comment trên route |
| Soft delete rules | ✅ PASS | Application là transaction data → state transition (CANCELLED), không hard delete |
| Domain rules (AGENTS.md) | ✅ PASS | Tuân thủ FR-001 đến FR-006 |

---

## Project Structure

### Documentation (feature này)

```text
.sdd/CuongLH/UC15-feat-submit-application/
├── spec.md              # Feature specification
├── context.md           # Ngữ cảnh dự án
├── plan.md              # File này (output của /speckit-plan)
└── tasks.md             # Sẽ tạo sau (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js    # POST /api/v1/applications handler
│   ├── services/
│   │   └── application.service.js       # submitApplication() — business logic
│   ├── repositories/
│   │   └── application.repository.js    # findActiveByUserAndEvent(), createApplication()
│   ├── middlewares/
│   │   ├── auth.middleware.js            # JWT verification
│   │   └── validators/
│   │       ├── application.validator.js # submitApplicationSchema (Zod)
│   │       └── validate.js              # validate() middleware wrapper
│   ├── routes/
│   │   └── application.routes.js        # POST / + PATCH /:id/cancel
│   └── utils/
│       ├── response.util.js             # successResponse(), errorResponse()
│       └── app-error.util.js            # AppError class
├── prisma/
│   └── schema.prisma                    # Application model
└── tests/
    └── (application tests)

frontend/
├── src/
│   ├── api/
│   │   └── axiosApi.js                  # Axios instance (withCredentials: true)
│   ├── components/
│   │   └── pages/
│   │       ├── EventDetailPage.jsx       # Nút "Đăng ký tham gia" → link đến ApplyEventPage
│   │       └── ApplyEventPage.jsx        # Form gửi đơn đăng ký
│   ├── hooks/
│   │   └── useEventDetail.js            # Hook fetch event detail
│   ├── services/
│   │   ├── application.service.js       # submitApplication(eventId, message)
│   │   └── event.service.js             # getEventDetail(eventId)
│   ├── contexts/
│   │   └── authContext.context.js       # useAuth() → user, isAuthenticated
│   └── App.js                           # Route: /volunteer/events/:id/apply → ApplyEventPage
└── tests/
    └── (application tests)
```

**Structure Decision**: Web application monorepo với backend (Express 5 + Prisma) và frontend (React 19 SPA). Mỗi layer có file riêng biệt theo naming convention `[resource].[layer].js`.

---

## Complexity Tracking

> **Không có violations** — tất cả Constitution Check đều PASS.

---

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác minh hiện trạng implement, kiểm tra các file đã tồn tại, đánh giá mức độ hoàn thiện.

**Kết quả nghiên cứu**:

| # | File | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `backend/src/controllers/application.controller.js` | ✅ Hoàn thiện | `submitApplicationHandler` — parse req.user, gọi service, trả về 201 |
| 2 | `backend/src/services/application.service.js` | ✅ Hoàn thiện | `submitApplication()` — 6 business rules, Prisma transaction |
| 3 | `backend/src/repositories/application.repository.js` | ✅ Hoàn thiện | `findActiveByUserAndEvent()`, `createApplication()` |
| 4 | `backend/src/middlewares/validators/application.validator.js` | ✅ Hoàn thiện | `submitApplicationSchema` — Zod validation cho eventId |
| 5 | `backend/src/routes/application.routes.js` | ✅ Hoàn thiện | POST `/` + PATCH `/:id/cancel`, Swagger doc đầy đủ |
| 6 | `frontend/src/services/application.service.js` | ✅ Hoàn thiện | `submitApplication(eventId, message)` |
| 7 | `frontend/src/components/pages/ApplyEventPage.jsx` | ✅ Hoàn thiện | Form gửi đơn, loading/error/empty states, toast notification |
| 8 | `frontend/src/components/pages/EventDetailPage.jsx` | ✅ Hoàn thiện | Nút "Đăng ký tham gia" → link `/volunteer/events/:id/apply` |
| 9 | `frontend/src/hooks/useEventDetail.js` | ✅ Hoàn thiện | Fetch event detail + userApplication |
| 10 | `frontend/src/App.js` | ✅ Hoàn thiện | Route `/volunteer/events/:id/apply` → `ApplyEventPage` |

**Kết luận**: UC15 **đã được implement hoàn chỉnh** trên cả 2 tầng Backend và Frontend. Không có task implementation mới cần thực hiện. Phase 0-1-2 mang tính document hóa kiến trúc hiện tại.

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Document hóa data model, API contract, service contract, và quickstart guide dựa trên code hiện có.

#### 1. Data Model

**Bảng `applications`** (Prisma schema):

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `id` | Int (PK) | ✅ | Auto-increment |
| `userId` | Int (FK → users) | ✅ | ID của volunteer |
| `eventId` | Int (FK → events) | ✅ | ID của sự kiện |
| `status` | Enum: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `WAITING_PAYMENT`, `PAYMENT_EXPIRED` | ✅ | Mặc định `PENDING` khi tạo mới |
| `message` | String? | ❌ | Lời nhắn tùy chọn, max 500 ký tự |
| `createdAt` | DateTime | ✅ | Auto-set bởi Prisma |
| `updatedAt` | DateTime | ✅ | Auto-update bởi Prisma |

**Index**: `@@unique([userId, eventId])` — đảm bảo mỗi volunteer chỉ có 1 đơn duy nhất cho mỗi event (DB-level constraint, bổ trợ cho application-level check trong Service).

**Bảng liên quan `events`** (các field được select trong submit flow):

| Field | Type | Mô tả |
|---|---|---|
| `id` | Int (PK) | ID sự kiện |
| `status` | Enum: `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Chỉ cho đăng ký khi `PUBLISHED` |
| `startDate` | DateTime | Phải > hiện tại để được đăng ký |
| `maxCapacity` | Int | Sức chứa tối đa |
| `approvedParticipants` | Int | Số lượng đã được duyệt |
| `isPaid` | Boolean | Event có phí hay không |

#### 2. API Contract

**Endpoint**: `POST /api/v1/applications`

**Auth**: Required (JWT HttpOnly Cookie). Chỉ VOLUNTEER role.

**Request Body**:
```json
{
  "eventId": 5,
  "message": "Tôi mong muốn được tham gia sự kiện này"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `eventId` | integer | ✅ | `number().int().positive()` |
| `message` | string | ❌ | Tùy chọn, frontend giới hạn 500 ký tự |

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Đăng ký sự kiện thành công",
  "data": {
    "id": 1,
    "userId": 3,
    "eventId": 5,
    "status": "PENDING",
    "message": "Tôi mong muốn được tham gia sự kiện này",
    "createdAt": "2026-07-20T08:00:00.000Z"
  }
}
```

**Error Responses**:

| Status | Code | Tình huống |
|---|---|---|
| 400 | `BAD_REQUEST` | `eventId` không hợp lệ, hoặc sự kiện chưa PUBLISHED / đã bắt đầu |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải VOLUNTEER role |
| 404 | `NOT_FOUND` | Không tìm thấy sự kiện |
| 409 | `CONFLICT` | Sự kiện đã đủ người, hoặc volunteer đã có đơn active cho sự kiện này |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ |

#### 3. Service Contract

**Hàm**: `submitApplication(userId, role, eventId, message) → Application`

**Business Rules (FR-001 đến FR-006)**:

1. **FR-001**: Chỉ VOLUNTEER role mới được gọi (kiểm tra `role !== "VOLUNTEER"` → throw 403)
2. **FR-002**: Event phải tồn tại (`NOT_FOUND`), status = `PUBLISHED` (`BAD_REQUEST`), `startDate > now` (`BAD_REQUEST`)
3. **FR-003**: `approvedParticipants < maxCapacity` (`CONFLICT`)
4. **FR-004**: Không có application active nào khác cho cùng user+event. Terminal states cho phép re-apply: `CANCELLED`, `PAYMENT_EXPIRED` (`CONFLICT`)
5. **FR-005**: Luôn tạo application với `status = "PENDING"` (WAITING_PAYMENT được set sau khi Staff/Manager duyệt)
6. **FR-006**: Toàn bộ flow chạy trong `prisma.$transaction()` để đảm bảo atomicity

#### 4. Quick Start Guide

**Chạy local**:
```bash
# Backend
cd backend && npm install && npx prisma generate && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

**Test flow**:
1. Đăng nhập với tài khoản VOLUNTEER
2. Vào Event List → chọn một event PUBLISHED
3. Click "Đăng ký tham gia" → được điều hướng đến `/volunteer/events/:id/apply`
4. Nhập lời nhắn (tùy chọn) → Click "Gửi đơn đăng ký"
5. Nhận toast "Đăng ký sự kiện thành công!" → redirect về Event Detail

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation thành atomic tasks.

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve.

**Expected Output**: `tasks.md` với atomic task breakdown. Dự kiến các task:

| # | Task | Layer | Mô tả |
|---|---|---|---|
| T1 | Tạo `submitApplicationSchema` (Zod) | Backend - Validator | Validate `eventId` là số nguyên dương |
| T2 | Tạo `findActiveByUserAndEvent()` | Backend - Repository | Kiểm tra duplicate application |
| T3 | Tạo `createApplication()` | Backend - Repository | Insert application trong transaction |
| T4 | Implement `submitApplication()` | Backend - Service | 6 business rules, Prisma transaction |
| T5 | Implement `submitApplicationHandler` | Backend - Controller | Parse request, gọi service, return response |
| T6 | Đăng ký route + Swagger doc | Backend - Routes | `POST /api/v1/applications` + @swagger |
| T7 | Tạo `applicationService.submitApplication()` | Frontend - Service | Gọi API POST /api/v1/applications |
| T8 | Tạo `ApplyEventPage.jsx` | Frontend - Page | Form gửi đơn, loading/error/empty states |
| T9 | Thêm nút "Đăng ký tham gia" | Frontend - Page | `EventDetailPage.jsx` → link đến ApplyEventPage |
| T10 | Đăng ký route | Frontend - Router | `/volunteer/events/:id/apply` → `ApplyEventPage` |
| T11 | Viết unit test Service | Backend - Test | Test 6 business rules, happy path + error paths |
| T12 | Viết integration test API | Backend - Test | Test endpoint với các status codes |
| T13 | Viết unit test ApplyEventPage | Frontend - Test | Test form submit, validation, error handling |

**Trạng thái hiện tại**: T1-T10 đã hoàn thành. T11-T13 (testing) cần được triển khai.

**Dependencies**: 
- T1 → T2 → T3 → T4 → T5 → T6 (Backend chain)
- T7 → T8 → T10 (Frontend chain)
- T5 + T6 + T9 → T10 (Integration)
- T11, T12, T13 độc lập (có thể chạy song song)

---

## Risk Assessment

### HIGH RISK

- **Race Condition khi nhiều volunteer cùng đăng ký**: Khi `approvedParticipants` gần chạm `maxCapacity`, nhiều request đồng thời có thể vượt capacity.
  - **Mitigation**: Đã xử lý bằng Prisma `$transaction` với isolation level mặc định của MySQL. Service check `approvedParticipants < maxCapacity` nằm trong transaction, đảm bảo atomic read-check-write.

### MEDIUM RISK

- **Duplicate Application**: Volunteer có thể cố gửi nhiều đơn cho cùng event.
  - **Mitigation**: `findActiveByUserAndEvent()` check trong transaction + `@@unique([userId, eventId])` constraint ở DB level.

- **Event state change trong lúc submit**: Event có thể bị hủy hoặc chuyển trạng thái ngay sau khi volunteer mở form.
  - **Mitigation**: Service check `event.status === "PUBLISHED"` và `startDate > now` trong transaction, nếu fail sẽ throw error và frontend hiển thị toast lỗi.

### LOW RISK

- **Lời nhắn quá dài**: Frontend giới hạn 500 ký tự ở `<textarea maxLength={500}>`, backend không giới hạn cứng (DB field là TEXT).
  - **Mitigation**: Frontend validation + hiển thị counter `{message.length}/500`.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: Volunteer có thể gửi đơn đăng ký từ trang ApplyEventPage → **✅ Đã implement** (`ApplyEventPage.jsx` với form submit)
- **SC-002**: Đơn được tạo với status PENDING → **✅ Đã implement** (`initialStatus = "PENDING"` trong service)
- **SC-003**: Hiển thị thông tin sự kiện trước khi gửi đơn → **✅ Đã implement** (Event summary card trong `ApplyEventPage.jsx`)
- **SC-004**: Không cho đăng ký khi event đã đầy → **✅ Đã implement** (capacity check trong service + UI ẩn nút khi `isFull`)
- **SC-005**: Không cho đăng ký trùng lặp → **✅ Đã implement** (duplicate check trong service)
- **SC-006**: Toast notification khi thành công/thất bại → **✅ Đã implement** (`react-toastify` trong `ApplyEventPage.jsx`)
- **SC-007**: Redirect về Event Detail sau khi gửi thành công → **✅ Đã implement** (`navigate(/volunteer/events/${eventId})`)

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit test cho `application.service.js` (target: >80% coverage)
- [ ] Integration test cho `POST /api/v1/applications` (happy path + tất cả error paths)
- [ ] Frontend test cho `ApplyEventPage.jsx` (form submit, loading state, error state)
- [ ] Không có lỗi linting (`npm run lint` pass ở cả backend và frontend)
- [ ] Swagger doc cập nhật đầy đủ (đã có sẵn)
- [ ] Audit log được ghi nhận cho flow submit application
- [ ] Không còn comment `TODO` hoặc `FIXME` trong code
- [ ] Kiểm tra cross-browser: form hiển thị đúng trên Chrome, Firefox, Edge
- [ ] Responsive: form hoạt động trên mobile (max-width: 700px)

---

## Next Steps

1. Review plan này với team
2. Chạy `detect_changes()` để xác minh phạm vi ảnh hưởng
3. Viết unit test cho `application.service.js` (T11)
4. Viết integration test cho API endpoint (T12)
5. Viết frontend test cho `ApplyEventPage.jsx` (T13)
6. Chạy `/speckit-tasks` để tạo `tasks.md` chi tiết

---

## Questions for Stakeholders

1. **Có cần thêm validation message ở backend không?**: Hiện tại backend không validate `message` (DB field là TEXT nullable). Frontend giới hạn 500 ký tự.
   - **Context**: Nếu có attack vector gửi message cực lớn, DB vẫn lưu được nhưng tốn storage.
   - **Options**: (A) Giữ nguyên — frontend đã giới hạn, (B) Thêm Zod validation `message.max(500)` ở backend
   - **Recommendation**: (A) — Giữ nguyên, vì DB field là TEXT, không có rủi ro overflow. Nếu cần, thêm sau.

2. **Có cần gửi email confirmation sau khi submit không?**: Hiện tại chưa có email notification.
   - **Context**: Một số hệ thống VMS gửi email xác nhận "Đơn của bạn đã được ghi nhận".
   - **Options**: (A) Không cần — để dành cho phase sau, (B) Thêm email service
   - **Recommendation**: (A) — Để dành cho phase sau, vì không nằm trong scope UC15.

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: 4-6 giờ (đã hoàn thành implement, còn lại testing: 2-3h unit test BE, 1-2h integration test, 1h frontend test)  
**Priority**: P1 (Core flow — Volunteer phải đăng ký được sự kiện)