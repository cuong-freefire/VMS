# Implementation Plan: Add Event (UC15)

**Branch**: `015-feat-add-event` | **Date**: 2026-06-29 | **Spec**: [SPEC.md](./SPEC.md)

**Input**: Feature specification from `SPEC.md`

## Summary

Staff cần khả năng tạo sự kiện tình nguyện mới với các thông tin cơ bản (title, description, dates, location, max capacity) để kêu gọi Volunteer tham gia. Feature này là điểm khởi đầu cho toàn bộ quy trình quản lý sự kiện trong VMS.

**Technical Approach**: RESTful API endpoint `POST /api/v1/events` với Zod validation, Prisma ORM để lưu trữ, và JWT authentication để xác định Staff và Organization ID. Frontend form sử dụng React Hook Form với Material UI components.

## Technical Context

**Language/Version**: JavaScript (ES Modules), Node.js 18+, React 19

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, JWT (jsonwebtoken)
- Frontend: React 19, Material UI, React Hook Form, Axios

**Storage**: MySQL database, bảng `events` và `organizations` (đã có sẵn theo DATABASE.md)

**Testing**: Jest + Supertest (backend integration tests), Jest + React Testing Library (frontend component tests)

**Target Platform**: Web application (Chrome/Firefox/Edge, desktop-first)

**Project Type**: Full-stack web service (REST API + React SPA)

**Performance Goals**: 
- API response time < 200ms (p95)
- Form submission < 1 second end-to-end
- Image upload via Cloudinary < 3 seconds

**Constraints**: 
- Staff CHỈ được tạo event cho organization của mình (authorization check)
- Start date PHẢI > current date (business rule validation)
- Image upload giới hạn 5MB, formats: JPG/PNG only

**Scale/Scope**: 
- Expected: 50-100 events/month
- Concurrent Staff users: ~10
- Single feature implementation (UC15 only)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) - ✅ PASS
- ✅ NO password plaintext (N/A - không liên quan)
- ✅ NO SQL injection (Prisma parameterized queries)
- ✅ NO hard delete (Soft delete với `is_active` flag)
- ✅ NO credentials leak (Error messages không chứa sensitive data)
- ✅ UserId from JWT (Lấy `created_by` và `organization_id` từ `req.user`)
- ✅ NO commit secrets (Image upload qua Cloudinary, API keys trong .env)
- ✅ Input validation (Zod schema cho request body)
- ✅ Authentication (Protected route với `authMiddleware.authenticate`)
- ✅ File upload (Cloudinary, max 5MB, validate format)

### Layer 2 (Architecture) - ✅ PASS
- ✅ Layered Architecture: Controller → Service → Repository
- ✅ Cross-module: Event service KHÔNG query trực tiếp User/Organization tables
- ✅ Module Ownership: TienTD owns Event Management module
- ✅ Transactions: Event creation wrapped trong Prisma transaction
- ✅ Audit Log: Log event creation (who, when, what, entity_id)

### Layer 3 (Standards) - ✅ PASS
- ✅ Test coverage: Target 80% cho EventService
- ✅ Performance: < 200ms response time
- ✅ API format: Tuân thủ ADR-006 (response.util.js)

**Gate Result**: ✅ ALL PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/event-management/UC15-feat-add-event/
├── CONTEXT.md           # Problem statement & domain knowledge
├── SPEC.md              # Feature specification (8 sections)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (technical research)
├── data-model.md        # Phase 1 output (entities & relationships)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   └── POST-events.md   # API endpoint documentation
└── tasks.md             # Phase 2 output (NOT created by this plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── event.controller.js      # [NEW] HTTP handlers cho events
│   ├── services/
│   │   └── event.service.js         # [NEW] Business logic tạo event
│   ├── repositories/
│   │   └── event.repository.js      # [NEW] Prisma queries cho events
│   ├── validators/
│   │   └── event.validator.js       # [NEW] Zod schemas cho event input
│   ├── routes/
│   │   └── event.routes.js          # [NEW] Express routes cho /api/v1/events
│   └── middleware/
│       └── auth.middleware.js       # [EXISTS] JWT authentication
└── tests/
    └── integration/
        └── event.test.js            # [NEW] Integration tests

frontend/
├── src/
│   ├── pages/
│   │   └── AddEventPage.jsx         # [NEW] Main event creation page
│   ├── components/
│   │   └── events/
│   │       └── EventForm.jsx        # [NEW] Reusable event form
│   ├── services/
│   │   └── event.service.js         # [NEW] API client cho events
│   └── utils/
│       └── validation.js            # [UPDATE] Add event validation helpers
└── tests/
    └── pages/
        └── AddEventPage.test.jsx    # [NEW] Component tests
```

**Structure Decision**: Web application structure (Option 2) được chọn vì VMS là full-stack app với backend REST API và frontend React SPA. Backend tuân thủ kiến trúc phân tầng (Controller-Service-Repository), frontend theo component-based architecture.

## Complexity Tracking

> **No violations** - Constitution Check passed all gates. Không có complexity nào cần justify.

---

## Phase 0: Outline & Research

### Research Questions

**Q1: Làm sao validate Start Date > Current Date một cách an toàn?**
- **Finding**: Sử dụng Zod `.refine()` với Date comparison. Backend PHẢI validate lại vì client time không đáng tin cậy.
- **Source**: Zod documentation - Custom validation methods
- **Decision**: Validate cả Frontend (UX) và Backend (Security). Backend dùng `new Date()` server time.

**Q2: Làm sao đảm bảo Staff chỉ tạo event cho organization của mình?**
- **Finding**: Extract `organization_id` từ JWT token (`req.user.organization_id`), TUYỆT ĐỐI KHÔNG tin request body.
- **Source**: ADR-002, Lesson 3 trong CLAUDE.md
- **Decision**: Middleware `authMiddleware.authenticate` inject `req.user`, Service lấy `organization_id` từ đó.

**Q3: Image upload workflow - sync hay async?**
- **Finding**: Cloudinary upload đồng bộ (blocking) nhưng nhanh (~1-2s). Nếu timeout > 5s, cần retry hoặc queue.
- **Source**: Cloudinary Node.js SDK documentation
- **Decision**: Sync upload trong transaction. Frontend disable submit button khi đang upload.

**Q4: Làm sao handle duplicate submission (user nhấn Submit nhiều lần)?**
- **Finding**: Frontend disable button sau first click. Backend dùng idempotency key hoặc unique constraint.
- **Source**: SC-007 trong SPEC.md
- **Decision**: Frontend disable button + loading state. Backend có unique constraint `(title, organization_id, start_date)` để catch duplicates.

**Q5: Status field - nên lưu "Draft" hay "Published"?**
- **Finding**: Database schema (DATABASE.md) có `status` ENUM('Draft', 'Published', 'In Progress', 'Completed', 'Cancelled').
- **Source**: DATABASE.md - events table schema
- **Decision**: Default "Draft". Staff có thể publish ngay trong form với checkbox "Publish immediately".

### Technical Stack Research

**Backend Dependencies (package.json)**:
```json
{
  "express": "^5.x",
  "prisma": "latest",
  "@prisma/client": "latest",
  "zod": "^3.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "cloudinary": "^1.x",
  "pino": "^8.x",
  "pino-http": "^8.x",
  "swagger-jsdoc": "^6.x",
  "swagger-ui-express": "^5.x"
}
```

**Frontend Dependencies (package.json)**:
```json
{
  "react": "^19.x",
  "@mui/material": "^5.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "react-hook-form": "^7.x",
  "axios": "^1.x",
  "bootstrap": "^5.x"
}
```

**Database Schema Reference** (từ DATABASE.md):
```sql
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  location VARCHAR(500),
  max_capacity INT NOT NULL,
  cover_image_url VARCHAR(500),
  status ENUM('Draft', 'Published', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Architecture Pattern

**Layered Architecture** (tuân thủ ADR-001 và AGENTS.md Section 6):
```text
Frontend Request
  ↓
Express Route (event.routes.js)
  ↓
Auth Middleware (validate JWT, inject req.user)
  ↓
Validation Middleware (Zod schema)
  ↓
Event Controller (HTTP layer, parse request/response)
  ↓
Event Service (Business logic, transaction handling)
  ↓
Event Repository (Prisma queries, data access)
  ↓
MySQL Database
```

**Cross-cutting Concerns**:
- **Logging**: Pino logger ở Controller và Service layers
- **Error Handling**: Centralized error middleware
- **Audit Trail**: AuditLog service gọi async sau transaction commit

---

## Phase 1: Design & Contracts

### 1. Data Model

**Entity: Event**
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
  status: 'Draft' | 'Published' | 'In Progress' | 'Completed' | 'Cancelled';
  is_active: boolean;            // Soft delete flag
  created_by: number;            // FK -> users.id (từ JWT)
  created_at: Date;              // Timestamp
  updated_at: Date;              // Timestamp
}
```

**Validation Rules** (Zod Schema):
- `title`: min 10 chars, max 255 chars, không chứa special chars nguy hiểm
- `description`: min 50 chars, max 5000 chars
- `start_date`: MUST be future date (> now + 24h buffer)
- `end_date`: MUST > start_date
- `max_capacity`: integer, min 1, max 10000
- `cover_image_url`: URL format, https only

**Database Constraints**:
- UNIQUE KEY `(title, organization_id, start_date)` - Prevent duplicate events
- CHECK `end_date > start_date`
- CHECK `max_capacity > 0`

### 2. API Contract

**Endpoint**: `POST /api/v1/events`

**Authentication**: Required (JWT via HttpOnly cookie)

**Authorization**: User role MUST be "Staff"

**Request Headers**:
```http
Content-Type: application/json
Cookie: vms_access_token=<jwt>
```

**Request Body**:
```json
{
  "title": "Mùa Hè Xanh 2026",
  "description": "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi...",
  "start_date": "2026-07-15T08:00:00.000Z",
  "end_date": "2026-07-20T17:00:00.000Z",
  "location": "Hà Giang, Việt Nam",
  "max_capacity": 50,
  "cover_image_url": "https://res.cloudinary.com/.../event-cover.jpg",
  "status": "Draft"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "organization_id": 10,
    "title": "Mùa Hè Xanh 2026",
    "description": "Chiến dịch tình nguyện...",
    "start_date": "2026-07-15T08:00:00.000Z",
    "end_date": "2026-07-20T17:00:00.000Z",
    "location": "Hà Giang, Việt Nam",
    "max_capacity": 50,
    "cover_image_url": "https://res.cloudinary.com/.../event-cover.jpg",
    "status": "Draft",
    "is_active": true,
    "created_by": 456,
    "created_at": "2026-06-29T14:52:00.000Z",
    "updated_at": "2026-06-29T14:52:00.000Z"
  }
}
```

**Error Responses**:

*401 Unauthorized* (Missing/invalid JWT):
```json
{
  "success": false,
  "error": "Authentication required"
}
```

*403 Forbidden* (User is not Staff):
```json
{
  "success": false,
  "error": "Only Staff can create events"
}
```

*400 Bad Request* (Validation error):
```json
{
  "success": false,
  "error": "Validation failed: start_date must be in the future"
}
```

*409 Conflict* (Duplicate event):
```json
{
  "success": false,
  "error": "Event with same title and date already exists"
}
```

*500 Internal Server Error*:
```json
{
  "success": false,
  "error": "Failed to create event. Please try again."
}
```

### 3. Quickstart Guide

**Prerequisites**:
- Node.js 18+ installed
- MySQL 8.0+ running
- Cloudinary account (free tier)
- `.env` file configured (see CLAUDE.md Section 6)

**Setup Steps**:

1. **Clone repo và install dependencies**:
```bash
cd VMS
npm install --prefix backend
npm install --prefix frontend
```

2. **Setup Database**:
```bash
cd backend
npx prisma migrate dev --name add_events_table
npx prisma generate
```

3. **Seed test data** (optional):
```bash
npm run seed
```

4. **Start Backend**:
```bash
npm run dev  # Starts on http://localhost:5000
```

5. **Start Frontend** (new terminal):
```bash
cd ../frontend
npm start  # Starts on http://localhost:3000
```

6. **Test API with curl**:
```bash
# Login first to get JWT cookie
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@org.com","password":"password"}' \
  -c cookies.txt

# Create event
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test Event",
    "description": "This is a test volunteer event with at least 50 characters to pass validation.",
    "start_date": "2026-08-01T09:00:00.000Z",
    "end_date": "2026-08-05T17:00:00.000Z",
    "location": "Hanoi, Vietnam",
    "max_capacity": 30
  }'
```

**Frontend Access**:
- Navigate to `http://localhost:3000/events/add`
- Login as Staff user
- Fill form and submit

**Testing**:
```bash
# Backend tests
cd backend
npm test tests/integration/event.test.js

# Frontend tests
cd frontend
npm test src/pages/__tests__/AddEventPage.test.jsx
```

### 4. Key Design Rules

**R1: UserId & OrganizationId EXTRACTION**
- ✅ MUST extract từ `req.user` (injected by JWT middleware)
- ❌ NEVER trust request body cho identity fields
- **Rationale**: Security - prevent user impersonation (Lesson 3, CLAUDE.md)

**R2: DATE VALIDATION Strategy**
- ✅ Validate cả Frontend (UX feedback) VÀ Backend (security gate)
- Backend dùng server time: `new Date()`, KHÔNG trust client date
- **Rationale**: Client time có thể bị manipulate

**R3: TRANSACTION BOUNDARY**
- Event creation + Audit log insert PHẢI wrap trong Prisma transaction
- **Code Pattern**:
```javascript
await prisma.$transaction(async (tx) => {
  const event = await tx.events.create({...});
  await tx.audit_logs.create({...});
  return event;
});
```

**R4: IMAGE UPLOAD Flow**
- Frontend upload image trước → get Cloudinary URL → submit form với URL
- HOẶC: Submit form trước → Backend upload image → update event record
- **Decision**: Frontend upload trước (giảm backend load)

**R5: ERROR MESSAGE Sanitization**
- NEVER expose database error trực tiếp cho client
- Map Prisma errors sang user-friendly messages
- **Example**: `P2002 unique constraint` → "Event already exists"

### 5. Done When

- [ ] Backend API `POST /api/v1/events` implemented và passing integration tests
- [ ] Zod validation schema cover tất cả required fields
- [ ] Authorization check: chỉ Staff có `organization_id` hợp lệ mới tạo được
- [ ] Soft delete: `is_active` flag được set correctly
- [ ] Audit log: Ghi nhận `created_by`, `created_at`, `entity_type='Event'`
- [ ] Frontend form component `AddEventPage.jsx` implement với Material UI
- [ ] Form validation với React Hook Form + Zod resolver
- [ ] Image upload tích hợp Cloudinary SDK
- [ ] Error handling: Display user-friendly messages cho tất cả error cases
- [ ] Test coverage ≥ 80% cho EventService
- [ ] Integration test cover happy path + error scenarios
- [ ] API documented đầy đủ trong Swagger
- [ ] Code review passed (no TODO/FIXME comments)
- [ ] Manual QA: Tạo event thành công qua UI và verify trong database
