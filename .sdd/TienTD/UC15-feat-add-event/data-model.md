# Data Model: Add Event (UC15)

**Feature**: UC15 - Staff Add Event | **Date**: 2026-06-29

## Entity Definition

### Event

**Purpose**: Đại diện cho sự kiện tình nguyện do Staff tạo ra để kêu gọi Volunteer tham gia.

**Database Table**: `events`

**TypeScript Interface**:
```typescript
interface Event {
  id: number;                    // PK, auto-increment
  organization_id: number;       // FK -> organizations.id (từ JWT)
  title: string;                 // Max 255 chars, required
  description: string;           // TEXT, required
  start_date: Date;              // DATETIME, required, MUST > now
  end_date: Date;                // DATETIME, required, MUST > start_date
  location: string;              // Max 500 chars, required
  max_capacity: number;          // INT, required, > 0
  cover_image_url: string | null; // Cloudinary URL, optional
  status: EventStatus;           // ENUM, default 'Draft'
  is_active: boolean;            // Soft delete flag, default true
  created_by: number;            // FK -> users.id (từ JWT)
  created_at: Date;              // Timestamp, auto
  updated_at: Date;              // Timestamp, auto-update
}

type EventStatus = 
  | 'Draft'         // Sự kiện mới tạo, chưa công bố
  | 'Published'     // Đã công bố, Volunteer có thể xem và apply
  | 'In Progress'   // Đang diễn ra
  | 'Completed'     // Đã kết thúc
  | 'Cancelled';    // Đã hủy
```

## Field Specifications

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | INT | PK, AUTO_INCREMENT, NOT NULL | - | Unique identifier |
| `organization_id` | INT | FK(organizations.id), NOT NULL, INDEX | - | Organization sở hữu event (từ JWT token) |
| `title` | VARCHAR(255) | NOT NULL, min 10 chars | - | Tên sự kiện |
| `description` | TEXT | NOT NULL, min 50 chars | - | Mô tả chi tiết |
| `start_date` | DATETIME | NOT NULL, CHECK(> now) | - | Ngày giờ bắt đầu |
| `end_date` | DATETIME | NOT NULL, CHECK(> start_date) | - | Ngày giờ kết thúc |
| `location` | VARCHAR(500) | NOT NULL | - | Địa điểm tổ chức |
| `max_capacity` | INT | NOT NULL, CHECK(> 0) | - | Số lượng Volunteer tối đa |
| `cover_image_url` | VARCHAR(500) | NULL | NULL | URL ảnh bìa (Cloudinary) |
| `status` | ENUM | NOT NULL | 'Draft' | Trạng thái sự kiện |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Soft delete flag |
| `created_by` | INT | FK(users.id), NOT NULL, INDEX | - | Staff ID tạo event (từ JWT) |
| `created_at` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | Thời gian cập nhật |

## Validation Rules

### Backend Validation (Zod Schema)

```javascript
const CreateEventSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(255, "Title must not exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/, "Title contains invalid characters"),
  
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  
  start_date: z.string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: "Start date must be in the future"
    }),
  
  end_date: z.string()
    .datetime(),
  
  location: z.string()
    .min(5, "Location must be at least 5 characters")
    .max(500, "Location must not exceed 500 characters"),
  
  max_capacity: z.number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity must not exceed 10000"),
  
  cover_image_url: z.string()
    .url("Invalid image URL")
    .regex(/^https:\/\//, "Image URL must use HTTPS")
    .optional()
    .nullable(),
  
  status: z.enum(['Draft', 'Published'])
    .default('Draft')
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"]
});
```

### Frontend Validation (React Hook Form)

```javascript
const eventFormValidation = {
  title: {
    required: "Title is required",
    minLength: { value: 10, message: "Minimum 10 characters" },
    maxLength: { value: 255, message: "Maximum 255 characters" }
  },
  description: {
    required: "Description is required",
    minLength: { value: 50, message: "Minimum 50 characters" }
  },
  start_date: {
    required: "Start date is required",
    validate: (value) => 
      new Date(value) > new Date() || "Start date must be in the future"
  },
  end_date: {
    required: "End date is required",
    validate: (value, formValues) =>
      new Date(value) > new Date(formValues.start_date) || 
      "End date must be after start date"
  },
  location: {
    required: "Location is required",
    minLength: { value: 5, message: "Minimum 5 characters" }
  },
  max_capacity: {
    required: "Max capacity is required",
    min: { value: 1, message: "Minimum 1 volunteer" },
    max: { value: 10000, message: "Maximum 10000 volunteers" }
  }
};
```

## Database Constraints

### Primary Key
```sql
PRIMARY KEY (id)
```

### Foreign Keys
```sql
FOREIGN KEY (organization_id) REFERENCES organizations(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE

FOREIGN KEY (created_by) REFERENCES users(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE
```

### Unique Constraints
```sql
-- Prevent duplicate events with same title, org, and start date
UNIQUE KEY unique_event (title, organization_id, start_date)
```

### Check Constraints
```sql
CHECK (end_date > start_date)
CHECK (max_capacity > 0)
```

### Indexes
```sql
INDEX idx_organization_id (organization_id)
INDEX idx_created_by (created_by)
INDEX idx_status (status)
INDEX idx_start_date (start_date)
INDEX idx_is_active (is_active)

-- Composite index for common queries
INDEX idx_org_status_active (organization_id, status, is_active)
```

## Relationships

### Event → Organization (Many-to-One)
```text
events.organization_id → organizations.id
- Một Organization có nhiều Events
- Một Event thuộc về một Organization duy nhất
- CASCADE UPDATE, RESTRICT DELETE
```

### Event → User (Many-to-One)
```text
events.created_by → users.id
- Một User (Staff) có thể tạo nhiều Events
- Một Event được tạo bởi một User duy nhất
- CASCADE UPDATE, RESTRICT DELETE
```

### Event → Application (One-to-Many)
```text
events.id ← applications.event_id
- Một Event có nhiều Applications từ Volunteers
- Một Application thuộc về một Event duy nhất
- Relationship handled by Application module
```

## State Transitions

```text
Draft ──────────┐
  │              │
  │ Publish      │ Cancel
  ↓              ↓
Published → In Progress → Completed
  │
  │ Cancel
  ↓
Cancelled
```

**State Transition Rules**:
1. `Draft` → `Published`: Staff publish event
2. `Published` → `In Progress`: Auto-transition khi `start_date` đến
3. `In Progress` → `Completed`: Auto-transition khi `end_date` qua
4. `Draft/Published` → `Cancelled`: Staff hủy event
5. **KHÔNG CHO PHÉP**: `Published/In Progress/Completed/Cancelled` → `Draft`

## Business Rules

1. **Organization Ownership**: 
   - `organization_id` PHẢI được lấy từ JWT token (`req.user.organization_id`)
   - TUYỆT ĐỐI KHÔNG tin `organization_id` từ request body

2. **Creator Identity**:
   - `created_by` PHẢI được lấy từ JWT token (`req.user.id`)
   - TUYỆT ĐỐI KHÔNG tin `created_by` từ request body

3. **Date Validation**:
   - `start_date` > current server time (buffer 24h khuyến nghị)
   - `end_date` > `start_date`
   - Validate ở CẢ Frontend (UX) và Backend (Security)

4. **Duplicate Prevention**:
   - Unique constraint `(title, organization_id, start_date)` enforce database-level
   - Prevent same event name at same time in same organization

5. **Soft Delete**:
   - KHÔNG hard delete Events (`DELETE FROM events`)
   - Chỉ set `is_active = false`
   - Preserve data integrity và audit trail

## Prisma Schema

```prisma
model Event {
  id               Int           @id @default(autoincrement())
  organizationId   Int           @map("organization_id")
  title            String        @db.VarChar(255)
  description      String        @db.Text
  startDate        DateTime      @map("start_date")
  endDate          DateTime      @map("end_date")
  location         String        @db.VarChar(500)
  maxCapacity      Int           @map("max_capacity")
  coverImageUrl    String?       @map("cover_image_url") @db.VarChar(500)
  status           EventStatus   @default(Draft)
  isActive         Boolean       @default(true) @map("is_active")
  createdBy        Int           @map("created_by")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  organization     Organization  @relation(fields: [organizationId], references: [id])
  creator          User          @relation(fields: [createdBy], references: [id])
  applications     Application[]

  @@unique([title, organizationId, startDate], name: "unique_event")
  @@index([organizationId])
  @@index([createdBy])
  @@index([status])
  @@index([startDate])
  @@index([isActive])
  @@index([organizationId, status, isActive])
  @@map("events")
}

enum EventStatus {
  Draft
  Published
  InProgress   @map("In Progress")
  Completed
  Cancelled
}
```

---

**Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: COMPLETE
