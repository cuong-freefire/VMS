# Data Model: View Application List (UC22)

**Feature**: View Application List  
**Date**: 2026-06-29  
**Phase**: Phase 1 - Design  
**Status**: DESIGN COMPLETE — Updated to match actual Prisma schema v3.0

---

## Overview

UC22 feature queries and displays a list of applications for a specific event, with status filtering and pagination. This data model reflects the actual Prisma schema v3.0 (reduced scope — no Organization model).

---

## Core Entities

### 1. Application (Main Entity)

Thực thể chính lưu trữ thông tin đơn đăng ký của tình nguyện viên cho một sự kiện.

```prisma
model Application {
  id          Int               @id @default(autoincrement())
  userId      Int               @map("user_id")
  eventId     Int               @map("event_id")
  status      ApplicationStatus @default(PENDING)
  message     String?           @db.Text
  processedBy Int?              @map("processed_by")
  processedAt DateTime?         @map("processed_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  submittedByUser User  @relation("applicationSubmittedByUser", fields: [userId], references: [id])
  event           Event @relation(fields: [eventId], references: [id])
  processedByUser User? @relation("applicationProcessedByUser", fields: [processedBy], references: [id])

  @@unique([userId, eventId])
  @@index([userId, status])
  @@index([eventId, status])
  @@index([processedBy])
  @@map("applications")
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

**Field Descriptions**:
- `id`: Integer auto-increment primary key (NOT UUID)
- `userId`: Foreign key to users table
- `eventId`: Foreign key to events table
- `status`: Current status of application (enum: PENDING, APPROVED, REJECTED, CANCELLED)
- `message`: Optional notes/motivation letter
- `processedBy`: Staff user ID who processed this application
- `processedAt`: Timestamp when application was processed
- `createdAt`: Submission timestamp (used for sorting: newest first)
- `updatedAt`: Last modification timestamp

**Business Rules**:
- Mỗi volunteer chỉ được submit 1 application per event (unique constraint on userId + eventId)
- Status transitions: `PENDING → [APPROVED | REJECTED | CANCELLED]` (one-way)
- Soft delete KHÔNG áp dụng cho Application (transaction data dùng state transitions)

---

### 2. User (Related Entity - Volunteer Profile)

Thông tin tình nguyện viên cần hiển thị trong danh sách.

```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique @db.VarChar(255)
  passwordHash  String   @db.VarChar(255) @map("password_hash")
  fullName      String   @db.VarChar(255) @map("full_name")
  phone         String?  @db.VarChar(20)
  avatarUrl     String?  @db.VarChar(500) @map("avatar_url")
  roleId        Int      @map("role_id")
  isActive      Boolean  @default(true) @map("is_active")
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
}
```

**UC22 Safe Fields** (for ApplicationListResponse):
- ✅ `id`: Volunteer ID
- ✅ `fullName`: Volunteer name (displayed in list)
- ✅ `avatarUrl`: Profile picture (displayed in list)

**Forbidden Fields** (MUST NOT include in response):
- ❌ `email` (privacy protection, không hiển thị trong list view)
- ❌ `phone`
- ❌ `passwordHash`
- ❌ `address` (not in schema)

---

### 3. Event (Related Entity - Ownership)

Sự kiện mà applications thuộc về, dùng để validate ownership.

```prisma
model Event {
  id                   Int         @id @default(autoincrement())
  title                String      @db.VarChar(500)
  description          String      @db.Text
  location             String      @db.VarChar(500)
  startDate            DateTime    @map("start_date")
  endDate              DateTime    @map("end_date")
  applicationDeadline  DateTime    @map("application_deadline")
  maxCapacity          Int         @map("max_capacity")
  approvedParticipants Int         @default(0) @map("approved_participants")
  imageUrl             String?     @db.VarChar(500) @map("image_url")
  categoryId           Int         @map("category_id")
  createdBy            Int         @map("created_by")
  status               EventStatus @default(DRAFT)
  isActive             Boolean     @default(true) @map("is_active")
  createdAt            DateTime    @default(now()) @map("created_at")
  updatedAt            DateTime    @updatedAt @map("updated_at")
}
```

**UC22 Usage**:
- Validate event exists via `eventRepository.findById(eventId)`
- Validate ownership via `event.createdBy !== currentUser.user_id`
- KHÔNG có Organization model trong schema v3.0

---

## Data Relationships

```
User (1) ─── (N) Application (N) ─── (1) Event
```

**Key Relationships**:
1. **Event 1:N Application**: Một event có nhiều applications
2. **User 1:N Application**: Một volunteer có nhiều applications (across different events)
3. **User 1:N Event**: Một staff có thể tạo nhiều events (via `createdBy`)

**UC22 Query Path**:
```
currentUser.user_id → Event.createdBy (ownership validation)
                    → Application.eventId (filter)
                    → User.id (JOIN for volunteer info)
```

---

## Database Indexes

The Prisma schema defines these indexes on the Application model:
- `@@index([userId, status])` — Filter by user + status
- `@@index([eventId, status])` — Filter by event + status (used by UC22)
- `@@index([processedBy])` — Filter by processor
- `@@unique([userId, eventId])` — One application per volunteer per event

---

## Validation Rules

### Input Validation (Zod Schemas)

```javascript
// Query params validation (actual implementation)
export const getApplicationsQuerySchema = z.object({
  status: z.string().trim().optional().refine(
    (val) => { if (!val) return true; return ['pending','approved','rejected','cancelled'].includes(val.toLowerCase()); },
    { message: 'Trạng thái không hợp lệ. Phải là: pending, approved, rejected, cancelled' }
  ),
  page: z.string().trim().optional().refine(
    (val) => { if (!val) return true; const num = Number(val); return Number.isInteger(num) && num >= 1 && num <= 1000; },
    { message: 'Tham số page không hợp lệ' }
  ),
  limit: z.string().trim().optional().refine(
    (val) => { if (!val) return true; const num = Number(val); return Number.isInteger(num) && num >= 1 && num <= 100; },
    { message: 'Tham số limit phải từ 1 đến 100' }
  )
});

// Path params validation
export const eventIdParamSchema = z.object({
  eventId: z.string().trim().refine(
    (val) => { const num = Number(val); return Number.isInteger(num) && num > 0; },
    { message: 'Mã sự kiện phải là số nguyên dương' }
  )
});
```

**Validation Rules**:
- `status`: lowercase string, one of: `pending`, `approved`, `rejected`, `cancelled` (or omitted)
- `page`: Integer 1-1000 (as string from query)
- `limit`: Integer 1-100 (as string from query)
- `eventId`: Positive integer (as string from path param)

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {
    "applications": [
      {
        "id": 1,
        "userId": 5,
        "eventId": 10,
        "status": "PENDING",
        "message": null,
        "processedBy": null,
        "processedAt": null,
        "createdAt": "2026-06-15T10:30:00.000Z",
        "updatedAt": "2026-06-15T10:30:00.000Z",
        "volunteer": {
          "id": 5,
          "fullName": "Nguyễn Văn A",
          "avatarUrl": "https://res.cloudinary.com/..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5
    }
  }
}
```

### Error Response Format (via response.util.js)

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": null
}
```

---

## Security Checklist

- [x] **JWT authentication** required (via authMiddleware)
- [x] **Event creator ownership** validated (via service layer)
- [x] **Sensitive data filtering** at database level (Prisma select)
- [x] **Input validation** with Zod
- [x] **SQL injection** prevented (Prisma parameterized queries)

---

**Phase 1 - Data Model Complete** ✅  
**Last Updated**: 2026-07-28