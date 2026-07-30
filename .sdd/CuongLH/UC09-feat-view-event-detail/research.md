# research.md — Phase 0: Technical Research for UC09 View Event Detail

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Researcher**: AI Agent (Member 1 - CuongLH context)

---

## Research Scope

Phase 0 research giải quyết các NEEDS CLARIFICATION từ Technical Context và chọn ra best practices cho technical decisions trong UC09.

### Research Questions

1. **Guest vs Volunteer Access**: Làm sao 1 endpoint `GET /api/v1/events/:id` phục vụ cả Guest (không JWT) và Volunteer (có JWT)?
2. **Prisma Query Strategy**: Dùng query nào để lấy đủ thông tin Event + relations trong 1 lần gọi DB?
3. **Slot Display Strategy**: Response JSON khác nhau thế nào giữa Guest và Volunteer?
4. **Event Visibility Rules**: Event ở status nào được phép hiển thị cho Guest/Volunteer?

---

## Research 1: Guest vs Volunteer Access Strategy

### Question

UC09 yêu cầu 1 API endpoint `GET /api/v1/events/:id` phục vụ cả Guest (chưa đăng nhập, không có JWT cookie) và Volunteer (đã đăng nhập, có JWT cookie). Làm thế nào để xử lý 2 luồng này trên cùng 1 endpoint?

### Options Investigated

#### Option A: Single Endpoint + Optional Auth Middleware

Tạo middleware `authenticateOptional` — parse JWT nếu cookie tồn tại, gán `req.user = decoded`; nếu không có cookie hoặc token invalid → gán `req.user = null` (KHÔNG throw 401). Controller tự phân biệt logic dựa trên `req.user`.

**Pros**:

- 1 endpoint duy nhất, RESTful design
- Controller tự quyết định response shape cho từng actor
- Không duplicate route definition
- Middleware nhẹ, không query DB cho Guest

**Cons**:

- Controller có thêm 1 nhánh `if (req.user)` — tăng nhẹ cognitive load
- Cần cẩn thận không expose thông tin nhạy cảm của Volunteer cho Guest

**Implementation Sketch**:

```javascript
// backend/src/middlewares/auth.middleware.js — thêm export mới
export async function authenticateOptional(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    const decode = verifyAccessToken(token);
    if (!decode || !decode.jti || !decode.user_id) {
        req.user = null;
        return next();
    }

    // Validate session (jti match + expiresAt)
    const session = await authRepository.getJtiByUserId(decode.user_id);
    const now = new Date();
    if (!session || session.jti !== decode.jti || (session.expiresAt && now > new Date(session.expiresAt))) {
        req.user = null;
        return next();
    }

    // Validate user exists + isActive + emailVerified
    const user = await authRepository.findUserByEmail(decode.email);
    if (!user || !user.isActive || !user.emailVerified) {
        req.user = null;
        return next();
    }

    req.user = decode;
    next();
}
```

#### Option B: Two Separate Endpoints

Tách thành 2 endpoint: `GET /api/v1/events/:id` (public, Guest) và `GET /api/v1/events/:id/detail` (authenticated, Volunteer).

**Pros**:

- Tách biệt hoàn toàn response shape
- Không cần optional auth middleware

**Cons**:

- 2 route definitions, 2 controller methods
- Không RESTful (cùng resource nhưng 2 URLs)
- Duplicate logic lấy Event data

### Decision

**CHỌN Option A: Single Endpoint + `authenticateOptional` Middleware**

**Lý do**:

1. **RESTful**: 1 resource = 1 URL. Guest và Volunteer truy cập cùng tài nguyên Event, chỉ khác response enrichment.
2. **Code DRY**: Không duplicate route handler, repository query, error handling.
3. **Pattern đã proven**: Middleware `authMiddleware` hiện tại đã xử lý JWT + session validation tốt. `authenticateOptional` là variant nhẹ hơn, kế thừa logic validate nhưng không throw 401.
4. **Controller simplicity**: Chỉ cần 1 `if (req.user)` để quyết định có include `userApplication` hay không.

**Trade-off Accepted**:

- Controller có thêm nhánh điều kiện — nhưng chỉ 1 lần, dễ test
- Guest response KHÔNG được chứa bất kỳ thông tin application nào của người khác

**Khi nào cần đánh giá lại?**:

- Khi Guest response cần enrichment khác biệt hoàn toàn (ví dụ: Guest thấy cache CDN, Volunteer thấy real-time data)
- Khi cần rate limiting khác nhau giữa Guest và Volunteer

---

## Research 2: Prisma Query Strategy cho Event Detail

### Question

Dùng Prisma query nào để lấy thông tin Event + Category + createdBy + userApplication (nếu có) trong tối thiểu lần gọi DB?

### Options Investigated

#### Option A: `findUnique` + `include` (1 lần DB query)

```javascript
prisma.event.findUnique({
    where: { id: eventId },
    include: {
        category: true,
        createdByUser: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { applications: { where: { status: 'APPROVED' } } } }
    }
});
```

**Pros**:

- 1 lần DB query duy nhất
- Prisma tự JOIN và trả về nested object
- `_count` trả về số lượng approved applications (slot đã đăng ký)

**Cons**:

- `_count` với `where` trong nested relation cần Prisma 4.x+ (đã hỗ trợ)
- Không filter được application của user hiện tại nếu muốn include (phải query riêng)

#### Option B: `findUnique` (Event) + `findFirst` (userApplication) — 2 queries

```javascript
const event = await prisma.event.findUnique({ where: { id }, include: { category: true, createdByUser: {...} } });
const userApplication = userId ? await prisma.application.findUnique({ where: { userId_eventId: { userId, eventId: id } } }) : null;
```

**Pros**:

- Tách biệt rõ ràng giữa Event data và User data
- `userApplication` chỉ query khi có userId

**Cons**:

- 2 lần DB queries (nhưng vẫn nhanh, ~10ms mỗi query)
- Phải merge kết quả trong service

### Decision

**CHỌN Option B: 2 queries tách biệt (Event + optional userApplication)**

**Lý do**:

1. **Separation of Concerns**: Event data và User-specific data là 2 concern khác nhau. Query riêng rõ ràng hơn.
2. **approved_participants field**: Event model đã có `approved_participants` (counter cache được Staff/Manager update khi duyệt đơn). Không cần `_count` query để tính số lượng approved → giảm DB load.
3. **Tránh include applications**: Nếu include `applications` relation, Guest có thể thấy danh sách application của người khác (security risk). Query `findUnique` với `{ userId, eventId }` composite key chỉ trả về application của chính user đó hoặc null.
4. **Hiệu năng**: 2 queries với indexed fields (`events.id` PRIMARY KEY, `applications.userId_eventId` UNIQUE) mỗi query ~5-10ms → tổng ~10-20ms → chấp nhận được.

**Implementation**:

```javascript
// Backend Service
const event = await eventRepository.findByIdWithRelations(eventId);
const userApplication = userId
    ? await applicationRepository.findByUserAndEvent(userId, eventId)
    : null;
```

**Query Plan Analysis**:

- `findByIdWithRelations`: SELECT events JOIN event_categories JOIN users WHERE events.id = ? → PRIMARY KEY lookup → ~5-10ms
- `findByUserAndEvent`: SELECT applications WHERE user_id = ? AND event_id = ? → UNIQUE composite key lookup → ~2-5ms
- Total: ~7-15ms → well under 100ms threshold

**Trade-off Accepted**:

- 2 queries thay vì 1 — nhưng tăng security (không leak application data) và tận dụng `approved_participants` counter cache

**Alternatives Considered**:

- Option A (include tất cả trong 1 query): Loại bỏ vì security concern (Guest có thể thấy danh sách applications) và không cần `_count` do có sẵn `approved_participants`.

---

## Research 3: Slot Display Strategy (Guest vs Volunteer)

### Question

Response JSON cho Guest và Volunteer khác nhau thế nào? Guest cần biết "còn bao nhiêu slot", Volunteer cần biết "mình đã đăng ký chưa".

### Decision

**Guest Response** (không có `req.user`):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Dọn dẹp công viên",
    "description": "...",
    "location": "Công viên Tao Đàn",
    "startDate": "2026-08-01T08:00:00.000Z",
    "endDate": "2026-08-01T17:00:00.000Z",
    "applicationDeadline": "2026-07-25T23:59:59.000Z",
    "maxCapacity": 50,
    "approvedParticipants": 32,
    "remainingSlots": 18,
    "isFull": false,
    "imageUrl": "https://...",
    "status": "PUBLISHED",
    "category": {
      "id": 1,
      "name": "Môi trường",
      "categoryType": "TYPE"
    },
    "createdBy": {
      "id": 5,
      "fullName": "Nguyễn Văn A",
      "avatarUrl": "https://..."
    },
    "userApplication": null
  }
}
```

**Volunteer Response** (có `req.user`):

```json
{
  "success": true,
  "data": {
    "... (các field giống Guest) ...",
    "userApplication": {
      "id": 42,
      "status": "APPROVED",
      "createdAt": "2026-07-15T10:30:00.000Z"
    }
  }
}
```

Hoặc nếu chưa apply:

```json
{
  "...": "...",
  "userApplication": null
}
```

### Key Design Decisions

1. **`userApplication` luôn trả về trong response**:
   - Guest → luôn là `null`
   - Volunteer → object hoặc `null`
   - Đảm bảo response structure consistent → Frontend không cần `if` check shape

2. **Slot fields**:
   - `maxCapacity`: Tổng số slot (từ Event model)
   - `approvedParticipants`: Số đã duyệt (từ counter cache `approved_participants` field)
   - `remainingSlots`: `maxCapacity - approvedParticipants` (tính toán)
   - `isFull`: `approvedParticipants >= maxCapacity` (boolean, tiện cho Frontend)

3. **Application Deadline**:
   - Frontend có thể kiểm tra `new Date() < new Date(data.applicationDeadline)` để disable nút "Đăng ký"
   - Backend KHÔNG validate deadline ở endpoint View Detail (để Guest vẫn xem được event đã hết hạn đăng ký)

4. **`userApplication` chỉ chứa thông tin tối thiểu**:
   - `id`, `status`, `createdAt` — đủ để hiển thị trạng thái đơn
   - KHÔNG bao gồm `message`, `processedBy`, `processedAt` — tránh lộ thông tin xét duyệt

**Trade-off Accepted**:

- `userApplication` luôn present trong response dù là null → tăng response size nhẹ, nhưng Frontend code đơn giản hơn

---

## Research 4: Event Visibility Rules

### Question

Event ở status nào được phép hiển thị cho Guest và Volunteer? Có cần filter `is_active` không?

### VMS Domain Rules Reference

Từ AGENTS.md Section 3 (Domain Rules) và DATABASE2.md:

- **Soft Delete Rule**: Event được soft delete qua `is_active = false`
- **Status Lifecycle**: DRAFT → PENDING_APPROVAL → PUBLISHED → IN_PROGRESS → COMPLETED (hoặc REJECTED / CANCELLED)

### EventStatus Enum Values

| Status | Visibility cho Guest/Volunteer | Ghi chú |
|--------|-------------------------------|---------|
| `DRAFT` | ❌ Không hiển thị | Event chưa hoàn thiện, chỉ Staff thấy trong dashboard |
| `PENDING_APPROVAL` | ❌ Không hiển thị | Đang chờ Manager duyệt |
| `PUBLISHED` | ✅ Hiển thị | Event đã được duyệt, sẵn sàng nhận đơn |
| `REJECTED` | ❌ Không hiển thị | Bị từ chối, lý do nội bộ |
| `IN_PROGRESS` | ✅ Hiển thị | Đang diễn ra, không nhận thêm đơn nhưng vẫn xem được |
| `COMPLETED` | ✅ Hiển thị | Đã kết thúc, xem lịch sử |
| `CANCELLED` | ❌ Không hiển thị | Đã hủy |

### Decision

**Filter conditions cho View Event Detail**:

```javascript
const WHERE_CONDITIONS = {
    id: eventId,
    isActive: true,
    status: { in: ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] }
};
```

**Rationale**:

1. **`isActive: true`**: Soft delete — event đã bị admin/staff vô hiệu hóa không được hiển thị.
2. **Status IN [PUBLISHED, IN_PROGRESS, COMPLETED]**:
   - `PUBLISHED`: Đang nhận đơn đăng ký (Guest/Volunteer cần thấy để apply)
   - `IN_PROGRESS`: Đang diễn ra (Volunteer cần xem thông tin sự kiện)
   - `COMPLETED`: Đã kết thúc (Volunteer xem lịch sử tham gia)
3. **Loại trừ DRAFT, PENDING_APPROVAL, REJECTED, CANCELLED**:
   - Đây là các trạng thái nội bộ, không dành cho end-user (Guest/Volunteer)
   - Nếu Volunteer cần xem chi tiết application đã nộp → sử dụng UC021 View Volunteer History

**Error Handling**:

| Tình huống | HTTP Status | Message |
|-----------|-------------|---------|
| Event không tồn tại | 404 | "Không tìm thấy sự kiện." |
| Event bị soft-deleted | 404 | "Không tìm thấy sự kiện." |
| Event ở status không public | 404 | "Không tìm thấy sự kiện." |

> **Note**: Tất cả đều trả về 404 (không phân biệt lý do) để tránh information disclosure (user enumeration pattern).

**Trade-off Accepted**:

- `IN_PROGRESS` và `COMPLETED` vẫn hiển thị → tăng nhẹ DB query nhưng cung cấp UX tốt hơn (Volunteer có thể xem lại event đã tham gia)

---

## Summary: Research Decisions

| Research Topic | Decision | Rationale Summary |
|---------------|----------|-------------------|
| **Guest vs Volunteer Access** | Single endpoint + `authenticateOptional` middleware | RESTful, DRY, kế thừa logic auth hiện có |
| **Prisma Query Strategy** | 2 queries: Event + optional userApplication | Security (không leak application data), tận dụng `approved_participants` counter cache |
| **Slot Display** | Guest: slots count; Volunteer: + userApplication status | Response consistent (userApplication luôn present), Frontend đơn giản |
| **Event Visibility** | `isActive: true` + `status IN ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED']` | Phù hợp Domain Rules, 404 cho mọi trường hợp không hiển thị |

---

## Next Steps (Phase 1)

Phase 0 research COMPLETE. Chuyển sang Phase 1: Design artifacts generation.

**Phase 1 Deliverables**:

1. `data-model.md` — Entity relationships, query patterns, response shapes
2. `contracts/api-contract.md` — API contract cho `GET /api/v1/events/:id`
3. `contracts/service-contract.md` — Service layer contract (EventService, optional ApplicationService)
4. `quickstart.md` — Setup guide cho developers implement UC09

**END OF RESEARCH.MD**
