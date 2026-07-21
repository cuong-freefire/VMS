# Data Model: Add Event (UC15)

**Feature**: UC15 - Staff Add Event | **Date**: 2026-06-29 | **Updated**: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0 (schema.prisma)

## Entity Definition

### Event

**Purpose**: Đại diện cho sự kiện tình nguyện do Staff tạo ra để kêu gọi Volunteer tham gia.

**Database Table**: `events`

**TypeScript Interface**:
```typescript
interface Event {
  id: number;                    // PK, auto-increment
  title: string;                 // Max 500 chars, required
  description: string;           // TEXT, required
  startDate: Date;               // DATETIME, required, MUST > now
  endDate: Date;                 // DATETIME, required, MUST > startDate
  applicationDeadline: Date;     // DATETIME, required, MUST < startDate
  location: string;              // Max 500 chars, required
  maxCapacity: number;           // INT, required, > 0
  approvedParticipants: number;  // INT, default 0
  imageUrl: string | null;       // Cloudinary URL, optional
  categoryId: number;            // FK -> event_categories.id, required
  createdBy: number;             // FK -> users.id (từ JWT)
  approvedBy: number | null;     // FK -> users.id
  approvedAt: Date | null;
  rejectedBy: number | null;     // FK -> users.id
  rejectedAt: Date | null;
  rejectedReason: string | null; // TEXT
  status: EventStatus;           // ENUM, default 'DRAFT'
  isActive: boolean;             // Soft delete flag, default true
  createdAt: Date;               // Timestamp, auto
  updatedAt: Date;               // Timestamp, auto-update
}

type EventStatus =
  | 'DRAFT'            // Sự kiện mới tạo
  | 'PENDING_APPROVAL' // Đang chờ Manager duyệt
  | 'PUBLISHED'        // Đã duyệt, Volunteer có thể xem và apply
  | 'REJECTED'         // Bị Manager từ chối
  | 'IN_PROGRESS'      // Đang diễn ra
  | 'COMPLETED'        // Đã kết thúc
  | 'CANCELLED';       // Đã hủy
```

## Field Specifications

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | INT | PK, AUTO_INCREMENT, NOT NULL | - | Unique identifier |
| `title` | VARCHAR(500) | NOT NULL, min 10 chars | - | Tên sự kiện |
| `description` | TEXT | NOT NULL, min 50 chars | - | Mô tả chi tiết |
| `startDate` | DATETIME | NOT NULL, CHECK(> now) | - | Ngày giờ bắt đầu |
| `endDate` | DATETIME | NOT NULL, CHECK(> startDate) | - | Ngày giờ kết thúc |
| `applicationDeadline` | DATETIME | NOT NULL, CHECK(< startDate) | - | Hạn đăng ký |
| `location` | VARCHAR(500) | NOT NULL | - | Địa điểm tổ chức |
| `maxCapacity` | INT | NOT NULL, CHECK(> 0) | - | Số lượng Volunteer tối đa |
| `approvedParticipants` | INT | NOT NULL, CHECK(>= 0) | 0 | Số lượng đã duyệt |
| `imageUrl` | VARCHAR(500) | NULL | NULL | URL ảnh bìa (Cloudinary) |
| `categoryId` | INT | FK(event_categories.id), NOT NULL, INDEX | - | Danh mục sự kiện |
| `createdBy` | INT | FK(users.id), NOT NULL, INDEX | - | Staff ID tạo event |
| `approvedBy` | INT | FK(users.id), NULL | NULL | Manager ID duyệt |
| `approvedAt` | DATETIME | NULL | NULL | Thời gian duyệt |
| `rejectedBy` | INT | FK(users.id), NULL | NULL | Manager ID từ chối |
| `rejectedAt` | DATETIME | NULL | NULL | Thời gian từ chối |
| `rejectedReason` | TEXT | NULL | NULL | Lý do từ chối |
| `status` | ENUM | NOT NULL | 'DRAFT' | Trạng thái sự kiện |
| `isActive` | BOOLEAN | NOT NULL | TRUE | Soft delete flag |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Thời gian tạo |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | Thời gian cập nhật |

## Validation Rules

### Backend Validation (Zod Schema)

```javascript
const createEventSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(500, "Title must not exceed 500 characters"),
  
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  
  startDate: z.string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: "Start date must be in the future"
    }),
  
  endDate: z.string()
    .datetime(),
  
  applicationDeadline: z.string()
    .datetime(),
  
  location: z.string()
    .min(5, "Location must be at least 5 characters")
    .max(500, "Location must not exceed 500 characters"),
  
  maxCapacity: z.number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity must not exceed 10000"),
  
  categoryId: z.number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive"),
  
  imageUrl: z.string()
    .url("Invalid image URL")
    .regex(/^https:\/\//, "Image URL must use HTTPS")
    .optional()
    .nullable(),
  
  status: z.enum(['DRAFT']).optional().default('DRAFT')
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine((data) => new Date(data.applicationDeadline) < new Date(data.startDate), {
  message: "Application deadline must be before start date",
  path: ["applicationDeadline"]
});
```

## State Transitions

```text
DRAFT
  │
  │ Submit for approval
  ↓
PENDING_APPROVAL
  │
  ├── Manager approves ──→ PUBLISHED ──→ IN_PROGRESS ──→ COMPLETED
  │
  └── Manager rejects ──→ REJECTED
                           │
                           │ Staff edits & resubmits
                           ↓
                         PENDING_APPROVAL
```

**State Transition Rules**:
1. `DRAFT` → `PENDING_APPROVAL`: Staff submit for approval
2. `PENDING_APPROVAL` → `PUBLISHED`: Manager approves
3. `PENDING_APPROVAL` → `REJECTED`: Manager rejects
4. `REJECTED` → `PENDING_APPROVAL`: Staff edits and resubmits
5. `PUBLISHED` → `IN_PROGRESS`: Auto when `startDate` arrives
6. `IN_PROGRESS` → `COMPLETED`: Auto when `endDate` passes
7. `PUBLISHED` → `CANCELLED`: Staff/Manager cancels

## Business Rules

1. **Creator Identity**:
   - `createdBy` PHẢI được lấy từ JWT token (`req.user.user_id`)
   - TUYỆT ĐỐI KHÔNG tin `created_by` từ request body

2. **Date Validation**:
   - `startDate` > current server time
   - `endDate` > `startDate`
   - `applicationDeadline` < `startDate`

3. **Soft Delete**:
   - KHÔNG hard delete Events (`DELETE FROM events`)
   - Chỉ set `isActive = false`

## Prisma Schema Reference

Tham khảo file `backend/prisma/schema.prisma` — model `Event` và enum `EventStatus`.

---

**Version**: 2.0
**Last Updated**: 2026-07-18
**Status**: REVIEWED