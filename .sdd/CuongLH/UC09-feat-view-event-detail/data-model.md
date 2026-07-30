# data-model.md — Phase 1: Data Model for UC09 View Event Detail

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Author**: AI Agent (Member 1 - CuongLH context)

---

## 1. Entity Relationship Diagram (Text-based)

```
┌──────────────────────────┐
│     EventCategory        │
│──────────────────────────│
│ id          INT (PK)     │
│ name        VARCHAR(100) │
│ categoryType ENUM        │  1:N
│ isActive    BOOLEAN      │◄──────────────────────┐
│ createdAt   DATETIME     │                       │
│ updatedAt   DATETIME     │                       │
└──────────────────────────┘                       │
                                                   │
┌──────────────────────────┐                       │
│         Event            │                       │
│──────────────────────────│                       │
│ id              INT (PK) │                       │
│ title           VARCHAR  │                       │
│ description     TEXT     │                       │
│ location        VARCHAR  │                       │
│ startDate       DATETIME │                       │
│ endDate         DATETIME │                       │
│ applicationDeadline DT   │                       │
│ maxCapacity     INT      │                       │
│ approvedParticipants INT │                       │
│ imageUrl        VARCHAR  │                       │
│ status          ENUM     │                       │
│ isActive        BOOLEAN  │                       │
│ categoryId      INT (FK) │───────────────────────┘
│ createdBy       INT (FK) │───┐
│ createdAt       DATETIME │   │
│ updatedAt       DATETIME │   │
└──────────────────────────┘   │
                               │
┌──────────────────────────┐   │     N:1
│         User             │   │◄───────────────────┐
│──────────────────────────│   │                    │
│ id          INT (PK)     │◄──┘                    │
│ fullName    VARCHAR      │                        │
│ email       VARCHAR (UQ) │                        │
│ avatarUrl   VARCHAR      │                        │
│ role        ENUM         │                        │
│ isActive    BOOLEAN      │                        │
│ emailVerified BOOLEAN    │                        │
│ ...                      │                        │
└──────────────────────────┘                        │
                                                    │
┌──────────────────────────┐                        │
│      Application         │                        │
│──────────────────────────│                        │
│ id          INT (PK)     │                        │
│ userId      INT (FK)     │────────────────────────┘
│ eventId     INT (FK)     │───► Event
│ status      ENUM         │
│ message     TEXT?        │
│ processedBy INT? (FK)    │───► User
│ processedAt DATETIME?    │
│ createdAt   DATETIME     │
│ updatedAt   DATETIME     │
│                           │
│ UNIQUE(userId, eventId)  │
└──────────────────────────┘
```

## 2. Entity Definitions

### 2.1 Event Model

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | Int (Auto) | PK | Mã sự kiện duy nhất |
| `title` | String | NOT NULL | Tiêu đề sự kiện |
| `description` | Text? | NULLABLE | Mô tả chi tiết (HTML/Markdown) |
| `location` | String | NOT NULL | Địa điểm tổ chức |
| `startDate` | DateTime | NOT NULL | Thời gian bắt đầu |
| `endDate` | DateTime | NOT NULL | Thời gian kết thúc |
| `applicationDeadline` | DateTime | NOT NULL | Hạn cuối đăng ký |
| `maxCapacity` | Int | NOT NULL, DEFAULT 0 | Sức chứa tối đa |
| `approvedParticipants` | Int | NOT NULL, DEFAULT 0 | Số tình nguyện viên đã được duyệt (counter cache) |
| `imageUrl` | String? | NULLABLE | URL ảnh bìa sự kiện (Cloudinary) |
| `status` | EventStatus | NOT NULL, DEFAULT DRAFT | Trạng thái sự kiện |
| `isActive` | Boolean | NOT NULL, DEFAULT true | Soft delete flag |
| `categoryId` | Int | FK → EventCategory.id | Danh mục sự kiện |
| `createdBy` | Int | FK → User.id | Người tạo (Staff/Manager) |
| `createdAt` | DateTime | DEFAULT NOW() | Ngày tạo |
| `updatedAt` | DateTime | @updatedAt | Ngày cập nhật cuối |

**Prisma Schema Reference**:
```prisma
model Event {
  id                    Int               @id @default(autoincrement())
  title                 String
  description           String?           @db.Text
  location              String
  startDate             DateTime
  endDate               DateTime
  applicationDeadline   DateTime
  maxCapacity           Int               @default(0)
  approvedParticipants  Int               @default(0)
  imageUrl              String?
  status                EventStatus       @default(DRAFT)
  isActive              Boolean           @default(true)
  categoryId            Int?
  createdBy             Int?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  category              EventCategory?    @relation(fields: [categoryId], references: [id])
  createdByUser         User?             @relation(fields: [createdBy], references: [id])
  applications          Application[]
}
```

### 2.2 EventCategory Model

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | Int (Auto) | PK | Mã danh mục |
| `name` | String | NOT NULL | Tên danh mục |
| `categoryType` | EventCategoryType | NOT NULL | Loại danh mục (LOCATION/TIME/TYPE) |
| `isActive` | Boolean | NOT NULL, DEFAULT true | Soft delete flag |
| `createdAt` | DateTime | DEFAULT NOW() | - |
| `updatedAt` | DateTime | @updatedAt | - |

### 2.3 User Model (Relevant Fields)

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | Int (Auto) | PK | Mã người dùng |
| `fullName` | String | NOT NULL | Họ tên đầy đủ |
| `email` | String | UNIQUE, NOT NULL | Email |
| `avatarUrl` | String? | NULLABLE | URL ảnh đại diện |
| `role` | UserRole | NOT NULL | Phân quyền |
| `isActive` | Boolean | NOT NULL, DEFAULT true | Soft delete |
| `emailVerified` | Boolean | NOT NULL, DEFAULT false | Xác thực email |

### 2.4 Application Model (Relevant Fields)

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | Int (Auto) | PK | Mã đơn đăng ký |
| `userId` | Int | FK → User.id, UNIQUE(userId, eventId) | Tình nguyện viên |
| `eventId` | Int | FK → Event.id, UNIQUE(userId, eventId) | Sự kiện |
| `status` | ApplicationStatus | NOT NULL, DEFAULT PENDING | Trạng thái đơn |
| `message` | Text? | NULLABLE | Lời nhắn của tình nguyện viên |
| `processedBy` | Int? | FK → User.id | Người xét duyệt |
| `processedAt` | DateTime? | NULLABLE | Thời điểm xét duyệt |
| `createdAt` | DateTime | DEFAULT NOW() | Ngày nộp đơn |
| `updatedAt` | DateTime | @updatedAt | - |

## 3. Query Patterns

### 3.1 UC09: View Event Detail

#### Query 1: Fetch Event with Relations

```javascript
// Repository: eventRepository.findByIdWithRelations(eventId)
await prisma.event.findUnique({
    where: {
        id: eventId,
        isActive: true,
        status: { in: ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] }
    },
    select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        applicationDeadline: true,
        maxCapacity: true,
        approvedParticipants: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
            select: {
                id: true,
                name: true,
                categoryType: true
            }
        },
        createdByUser: {
            select: {
                id: true,
                fullName: true,
                avatarUrl: true
            }
        }
    }
});
```

**Indexes Used**:
- `events.id` — PRIMARY KEY (clustered index)
- `events.isActive` — filtered index candidate
- `events.status` — filtered index candidate

**Performance**: ~5-10ms với PRIMARY KEY lookup + 2 JOINs.

#### Query 2: Fetch User's Application (Volunteer Only)

```javascript
// Repository: applicationRepository.findByUserAndEvent(userId, eventId)
await prisma.application.findUnique({
    where: {
        userId_eventId: {
            userId: userId,
            eventId: eventId
        }
    },
    select: {
        id: true,
        status: true,
        createdAt: true
    }
});
```

**Indexes Used**:
- `applications.userId_eventId` — UNIQUE composite key (clustered or covering index)

**Performance**: ~2-5ms với composite key lookup.

**Conditional Execution**: Query này CHỈ chạy khi `req.user !== null` (tức là có Volunteer đã đăng nhập). Guest không trigger query này.

## 4. Response DTOs (Data Transfer Objects)

### 4.1 EventDetailDTO (Base - cho cả Guest và Volunteer)

```javascript
const EventDetailDTO = {
    id: Number,
    title: String,
    description: String | null,
    location: String,
    startDate: String,          // ISO 8601
    endDate: String,            // ISO 8601
    applicationDeadline: String, // ISO 8601
    maxCapacity: Number,
    approvedParticipants: Number,
    remainingSlots: Number,     // computed: maxCapacity - approvedParticipants
    isFull: Boolean,            // computed: approvedParticipants >= maxCapacity
    imageUrl: String | null,
    status: EventStatus,        // 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED'
    category: {
        id: Number,
        name: String,
        categoryType: String    // 'LOCATION' | 'TIME' | 'TYPE'
    },
    createdBy: {
        id: Number,
        fullName: String,
        avatarUrl: String | null
    },
    userApplication: null | UserApplicationDTO  // Guest → null; Volunteer → object hoặc null
};
```

### 4.2 UserApplicationDTO (Volunteer Only)

```javascript
const UserApplicationDTO = {
    id: Number,
    status: ApplicationStatus,  // 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    createdAt: String           // ISO 8601
};
```

> **Note**: `UserApplicationDTO` KHÔNG chứa `message`, `processedBy`, `processedAt` — theo Domain Rule: "Không expose thông tin xét duyệt nội bộ cho Volunteer".

### 4.3 API Response Envelope

```javascript
// Success Response
{
    success: true,
    data: EventDetailDTO
}

// Error Response
{
    success: false,
    error: {
        code: String,     // 'NOT_FOUND', 'VALIDATION_ERROR', 'INTERNAL_ERROR'
        message: String   // Human-readable error message
    }
}
```

## 5. Data Flow Diagram

```
┌──────────┐     HTTP GET /api/v1/events/:id     ┌──────────────┐
│  Client  │ ───────────────────────────────────► │  Express App │
│ (Guest/  │                                      │              │
│  Volun-  │ ◄─────────────────────────────────── │              │
│  teer)   │     JSON Response (EventDetailDTO)    │              │
└──────────┘                                      └──────┬───────┘
                                                         │
                                                   1. authenticateOptional
                                                      middleware
                                                         │
                                                   2. eventController.getById
                                                         │
                                              ┌──────────┴──────────┐
                                              │   EventService      │
                                              │─────────────────────│
                                              │ getEventDetail(id,  │
                                              │   userId?)          │
                                              └────────┬───────────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          │            │            │
                                    3a. findById  3b. findByUser  │
                                        WithRel      AndEvent      │
                                        ations      (nếu userId)   │
                                          │            │            │
                                   ┌──────┴──┐  ┌─────┴──────┐    │
                                   │ Event   │  │Application │    │
                                   │Repo     │  │Repo        │    │
                                   └────┬────┘  └─────┬──────┘    │
                                        │              │           │
                                   ┌─────┴──────┐ ┌────┴─────┐    │
                                   │  MySQL DB  │ │ MySQL DB │    │
                                   └────────────┘ └──────────┘    │
                                                                  │
                                         4. Map to EventDetailDTO │
                                            (compute slots, etc.) │
                                                                  │
                                         5. Return JSON response  │
```

**Step-by-step flow**:
1. `authenticateOptional` middleware: Parse JWT cookie (nếu có) → `req.user = decoded || null`
2. `eventController.getById(req, res)`: Gọi `eventService.getEventDetail(eventId, req.user?.user_id)`
3. `eventService.getEventDetail()`:
   a. Gọi `eventRepository.findByIdWithRelations(eventId)` → Event + Category + createdBy
   b. Nếu `userId` tồn tại: gọi `applicationRepository.findByUserAndEvent(userId, eventId)` → UserApplication | null
4. Map data sang `EventDetailDTO`: tính `remainingSlots`, `isFull`, gán `userApplication`
5. Return JSON response

## 6. Validation Rules

| Rule | Layer | Description |
|------|-------|-------------|
| `eventId` must be positive integer | Controller (param validation) | `z.object({ id: z.number().int().positive() })` |
| Event must exist + isActive + status visible | Repository (WHERE clause) | 404 nếu không tìm thấy |
| `userId` (nếu có) must be valid integer | Service (type check) | `typeof userId === 'number' && userId > 0` |

## 7. Caching Considerations (Future)

Hiện tại KHÔNG implement cache. Các lý do:

1. UC09 là read-only endpoint, nhưng cần real-time `approvedParticipants` (counter cache được update khi Staff/Manager duyệt đơn)
2. `userApplication` status cần real-time cho Volunteer đã đăng nhập
3. Traffic dự kiến thấp (< 100 req/s) → DB query trực tiếp đủ nhanh (7-15ms)

**Future**: Nếu cần scale, có thể cache Guest response với TTL 60s (vì Guest không cần real-time userApplication), dùng Redis.

---

## Summary

UC09 sử dụng 2 entity chính: **Event** (với relations Category + createdByUser) và **Application** (query optional cho Volunteer). Data flow từ Controller → Service → Repository với 1-2 DB queries tùy actor. Response DTO consistent cho cả Guest và Volunteer với `userApplication` luôn present.

**END OF DATA-MODEL.md**