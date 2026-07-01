# CLAUDE.md — Project Memory & Architecture

Tài liệu này là bộ nhớ dự án (Project Memory) giúp AI agents hiểu kiến trúc hệ thống, cấu trúc thư mục, các quyết định thiết kế quan trọng (ADR) và bài học kinh nghiệm.

## 1. Kiến trúc hệ thống & Phân công Module

### System Architecture
```text
Browser / React App
  |
  | Axios (credentials: include)
  v
Backend REST API (Express)
  |
  | Route -> Middleware -> Controller -> Service -> Repository
  v
Prisma -> MySQL
```

### Module Ownership & Responsibilities

**Xem bảng phân công LIVE (với status updates) tại `share_context.md` Section 1.**

**Cross-module Communication Rules:**
- Modules SHALL communicate via Service layer contracts, NOT direct Repository calls
- Shared utilities live in `/backend/src/utils` and `/frontend/src/utils`
- API contracts MUST be documented in `share_context.md` before implementation

## 2. Cấu trúc thư mục quan trọng

### File Naming Conventions

**Backend:**

| Type | Pattern | Example |
| --- | --- | --- |
| Controller | `[resource].controller.js` | `event.controller.js` |
| Service | `[resource].service.js` | `event.service.js` |
| Repository | `[resource].repository.js` | `event.repository.js` |
| Validator/schema | `[resource].validator.js` | `event.validator.js` |
| Middleware | `[feature].middleware.js` | `auth.middleware.js` |
| Config | `[provider].config.js` | `cors.config.js` |
| Utility | `[purpose].util.js` | `response.util.js` |

**Frontend:**

| Type | Pattern | Example |
| --- | --- | --- |
| Page/component | PascalCase `.jsx` | `EventDetailPage.jsx` |
| Hook | camelCase `.js` | `useAuth.js` |
| API client | camelCase `.js` | `eventApi.js` |
| Utility | camelCase `.js` | `formatCurrency.js` |

### Backend Structure
```text
backend/
├── src/
│   ├── app.js            # Express app configuration
│   ├── server.js         # Server entry point
│   ├── swagger-server.js # Swagger documentation server
│   ├── config/           # Logger, Swagger config
│   ├── controllers/      # HTTP layer (auth.controller.js)
│   ├── services/         # Business logic (auth.service.js)
│   ├── repositories/     # Data access layer (empty, ready for Prisma)
│   ├── middleware/       # Auth, logger middleware
│   ├── middlewares/      # Additional middlewares
│   ├── routes/           # API route definitions (auth.routes.js, user.routes.js)
│   ├── utils/            # Helper functions (jwt.util.js, response.util.js)
│   └── seeds/            # Database seed files
├── public/               # Static files
└── tests/                # Jest + Supertest integration tests

Note: prisma/ directory chưa được tạo - cần setup khi bắt đầu database schema
```

### Frontend Structure
```text
frontend/
├── public/               # Static files
├── src/
│   ├── index.js          # React app entry point
│   ├── App.js            # Main App component
│   ├── index.css         # Global styles
│   ├── api/              # Axios clients (axiosApi.js)
│   ├── assets/           # Images, fonts, static assets
│   ├── components/       # Reusable UI components
│   │   ├── layouts/      # Layout components
│   │   ├── pages/        # Page-level components
│   │   └── ui/           # UI components (buttons, inputs, etc.)
│   ├── contexts/         # React Context (authContext.context.js)
│   ├── hooks/            # Custom React hooks (empty, ready for useAuth.js)
│   ├── mock_datas/       # Mock data for development
│   ├── services/         # Service layer (auth.service.js, user.service.js)
│   └── utils/            # Frontend utilities
└── tests/                # Jest + React Testing Library (chưa setup)
```

### Spec Structure
```text
.sdd/
└── specs/
    ├── feat-apply-event/
    │   ├── CONTEXT.md    # Problem statement, constraints
    │   ├── SPEC.md       # Feature specification (EARS notation)
    │   ├── PLAN.md       # Implementation plan
    │   └── TASKS.md      # Atomic tasks with dependencies
    └── feat-attendance/
        └── ...
```

## 3. Quyết định kiến trúc (ADR — Architectural Decision Records)

### ADR-001: MySQL cho VMS
**Context**: Cần database cho hệ thống quản lý tình nguyện viên với ACID compliance.

**Decision**: Sử dụng MySQL với Prisma ORM.

**Rationale**:
- ACID compliance cho giao dịch quyên góp (Donation) và điểm danh (Attendance)
- Relational model phù hợp với cấu trúc: User ↔ Application ↔ Event
- Prisma type-safe queries giảm SQL injection risk
- Mature ecosystem, wide community support

**Consequences**:
- Phải dùng Prisma migrations cho schema changes
- Soft delete bắt buộc để preserve audit trail
- Transactions phải được handle ở Service layer

---

### ADR-002: JWT HttpOnly Cookies
**Context**: Cần authentication mechanism an toàn cho web app.

**Decision**: JWT lưu trong HttpOnly cookies, KHÔNG dùng localStorage.

**Rationale**:
- HttpOnly cookies prevent XSS attacks
- SameSite=Strict/Lax prevent CSRF
- Stateless authentication scales well
- Frontend KHÔNG cần quản lý token storage

**Consequences**:
- Frontend phải config `credentials: 'include'` cho Axios
- Backend phải config CORS để accept credentials
- Token refresh phải qua dedicated endpoint

---

### ADR-003: Zod Validation
**Context**: Cần validate input data từ Frontend và bảo vệ API.

**Decision**: Sử dụng Zod cho tất cả API input validation.

**Rationale**:
- Type-safe schema definition
- Reusable schemas giữa middleware và service
- Clear error messages cho client
- Runtime validation bổ sung cho Prisma

**Consequences**:
- Mọi POST/PUT/PATCH endpoint phải có Zod validator
- Validation errors return 400 với structured message
- Schemas phải được maintain khi API changes

---

### ADR-004: Cloudinary cho File Upload
**Context**: Cần lưu trữ ảnh đại diện, chứng nhận, event images.

**Decision**: Sử dụng Cloudinary, KHÔNG lưu files vào server filesystem.

**Rationale**:
- Scalable cloud storage
- Automatic image optimization/transformation
- CDN delivery for performance
- Free tier sufficient cho MVP

**Consequences**:
- File upload phải validate kích thước (Max 5MB) và định dạng
- Backend trả về Cloudinary URL, không lưu binary data
- Cần Cloudinary API key trong `.env`

---

### ADR-005: Soft Delete cho Master Data
**Context**: Cần preserve data integrity và audit trail.

**Decision**: User, Event, Organization, Category, Skill PHẢI dùng soft delete (`is_active: false`).

**Rationale**:
- Preserve historical data for reporting
- Prevent orphaned foreign keys
- Enable data recovery
- Audit compliance

**Consequences**:
- Queries phải filter `WHERE is_active = true`
- UI phải có "Active/Inactive" toggle cho admin
- Cascade delete phải được handle carefully

---

### ADR-006: Standardized API Response Format
**Context**: Cần format response nhất quán cho tất cả API endpoints.

**Decision**: Tất cả API response PHẢI dùng format:
```javascript
{
  success: boolean,
  data?: any,      // Present when success = true
  error?: string   // Present when success = false
}
```

**Rationale**:
- Consistent error handling ở Frontend
- Dễ dàng cho automated testing
- Clear contract giữa FE và BE
- TypeScript-friendly structure

**Consequences**:
- Mọi endpoint phải dùng `response.util.js`
- KHÔNG tự ý dùng `res.json()` trực tiếp
- Error messages phải human-readable

## 4. Bài học kinh nghiệm (Lessons Learned)

### Lesson 1: Capacity Validation phải ở Service Layer
**What Happened**: Có bug cho phép approve vượt quá `max_capacity` vì validation chỉ ở Controller.

**Root Cause**: Controller validation không atomic với database transaction.

**Fix**: Validate capacity trong `ApplicationService.approveApplication()` với transaction lock.

**Takeaway**: Business invariants PHẢI được enforce ở Service layer, không phải Controller.

---

### Lesson 2: Luồng trạng thái Application cần Finite State Machine
**What Happened**: Có case Application bị set từ `Rejected` về `Pending`, gây confusion.

**Root Cause**: Không có state transition rules rõ ràng.

**Fix**: Implement state machine: `Pending → [Approved | Rejected]` (one-way only).

**Takeaway**: Sử dụng enum và validation cho state transitions trong critical workflows.

---

### Lesson 3: UserId PHẢI lấy từ JWT, KHÔNG từ request body
**What Happened**: Security issue khi user có thể giả mạo `userId` trong request body.

**Root Cause**: Controller đọc `req.body.userId` thay vì `req.user.id` từ JWT.

**Fix**: Middleware `authenticate()` inject `req.user`, Service ONLY đọc từ đó.

**Takeaway**: NEVER trust client-provided identity. Always extract from verified token.

---

### Lesson 4: Audit Log phải được log bất đồng bộ
**What Happened**: API response chậm vì wait audit log write.

**Root Cause**: Audit log write đồng bộ trong transaction chính.

**Fix**: Audit log write vào queue/async handler sau khi transaction commit.

**Takeaway**: Non-critical side effects (logging, notifications) nên được decouple khỏi main business logic.

## 5. Anti-Patterns (FORBIDDEN)

### ❌ Cross-module Repository Import
```javascript
// BAD: EventService import ApplicationRepository trực tiếp
import ApplicationRepository from '../application/application.repository.js';
```

**Why Bad**: Tạo hidden coupling, khó test và maintain.

**Correct Approach**: EventService gọi `ApplicationService.getByEventId()`.

---

### ❌ Business Logic trong Controller
```javascript
// BAD: Logic approve trong Controller
if (application.status !== 'Pending') {
  return res.status(400).json({ error: 'Cannot approve' });
}
```

**Why Bad**: Logic bị duplicate, khó test, không reusable.

**Correct Approach**: Delegate to `ApplicationService.approve()`.

---

### ❌ Console.log trong Production Code
```javascript
// BAD
console.log('User logged in:', userId);
```

**Why Bad**: Không structured, không có log levels, performance overhead.

**Correct Approach**: Dùng Pino logger.

---

### ❌ Hard Delete Critical Data
```javascript
// BAD: Xóa vật lý User record
await prisma.user.delete({ where: { id: userId } });
```

**Why Bad**: Mất audit trail, break foreign keys, không recover được.

**Correct Approach**: `UPDATE users SET is_active = false WHERE id = ?`.

## 6. Environment Variables

### Backend `.env` (Example)
```text
PORT=5000
API_PREFIX=/api/v1
FRONTEND_ORIGIN=http://localhost:3000

DATABASE_URL=mysql://user:pass@localhost:3306/vms

AUTH_SECRET=your-jwt-secret-key
COOKIE_ACCESS_NAME=vms_access_token
COOKIE_REFRESH_NAME=vms_refresh_token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10

CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

VNPAY_TMN_CODE=your-tmn
VNPAY_HASH_SECRET=your-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### Frontend `.env` (Example)
```text
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

**Security Rules:**
- NEVER commit real `.env` files
- Use `.env.example` as template
- Rotate secrets regularly
- Use different secrets per environment (dev/staging/prod)

## 7. Testing Strategy

### Backend Testing (Jest + Supertest)
- **Unit Tests**: Service layer business logic (80% coverage target)
- **Integration Tests**: API endpoints với real database (test DB)
- **Test Structure**: `tests/[module]/[feature].test.js`

### Frontend Testing (Jest + React Testing Library)
- **Component Tests**: UI components với mocked API
- **Integration Tests**: User flows với mocked backend
- **Test Structure**: `src/[component]/__tests__/[component].test.jsx`

### Test Data Strategy
- Use `prisma migrate reset --force` để reset test DB
- Seed test data với `prisma/seed.js`
- Clean up sau mỗi test case

## 8. GitNexus Integration

VMS project được indexed bởi GitNexus để hỗ trợ code intelligence, impact analysis và architecture navigation.

> **Index Status**: Run `node .gitnexus/run.cjs analyze` từ project root để update index. Nếu chưa có `.gitnexus/run.cjs`, chạy `npx gitnexus analyze`.

### Always Do (Bắt buộc)

- **MUST run impact analysis trước khi edit symbol**: Trước khi sửa function/class/method, chạy `impact({target: "symbolName", direction: "upstream"})` để báo cáo blast radius (callers, affected processes, risk level).
- **MUST run `detect_changes()` trước khi commit**: Verify changes chỉ affect expected symbols và execution flows. Để regression review, so sánh với default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn user** nếu impact analysis returns HIGH hoặc CRITICAL risk trước khi proceed.
- Khi explore unfamiliar code, dùng `query({search_query: "concept"})` để tìm execution flows thay vì grep. Nó trả về process-grouped results ranked by relevance.
- Khi cần full context về specific symbol (callers, callees, execution flows), dùng `context({name: "symbolName"})`.
- Để security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; cần `analyze --pdg`).

### Never Do (Cấm)

- NEVER edit function/class/method mà không chạy `impact` trước.
- NEVER ignore HIGH hoặc CRITICAL risk warnings từ impact analysis.
- NEVER rename symbols bằng find-and-replace — dùng `rename` (hiểu call graph).
- NEVER commit changes mà không chạy `detect_changes()` để check affected scope.

### GitNexus Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/VMS/context` | Codebase overview, check index freshness |
| `gitnexus://repo/VMS/clusters` | All functional areas |
| `gitnexus://repo/VMS/processes` | All execution flows |
| `gitnexus://repo/VMS/process/{name}` | Step-by-step execution trace |

### GitNexus CLI Skills

| Task | Skill File |
|------|-----------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

**Note**: Nếu môi trường không có GitNexus tooling, agent phải báo rõ không thể thực thi automation này trước khi tiếp tục các thay đổi thủ công.

---

## 9. Active Implementation Plans

<!-- SPECKIT START: Active plans tracked by /speckit-plan -->

### UC15: Add Event (TienTD - Event Management)
- **Branch**: `UC15-feat-add-event`
- **Status**: Planning phase completed
- **Plan**: `.sdd/TienTD/event-management/UC15-feat-add-event/plan.md`
- **Artifacts**:
  - Phase 0: `research.md` - Technical research (date validation, auth, image upload, duplicates, status)
  - Phase 1: `data-model.md` - Event entity schema, validation, constraints, state transitions
  - Phase 1: `contracts/POST-events.md` - Complete API contract với examples và tests
  - Phase 1: `quickstart.md` - Setup guide với troubleshooting
- **Key Decisions**:
  - JWT-based identity extraction (organization_id, created_by)
  - Dual validation (Frontend UX + Backend security)
  - Prisma transactions for event creation + audit log
  - Soft delete pattern with is_active flag
  - Cloudinary sync upload trong transaction
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

### UC16: Edit Event (TienTD - Event Management)
- **Branch**: `UC16-feat-edit-event`
- **Status**: Planning phase completed
- **Plan**: `.sdd/TienTD/UC16-feat-edit-event/plan.md`
- **Artifacts**:
  - Phase 0: `research.md` - Technical research (state validation, ownership, audit logging, notifications, image replacement)
  - Phase 1: `data-model.md` - Event update schema, validation, event_audit_log table, cross-module contracts
  - Phase 1: `contracts/PATCH-events-id.md` - Complete API contract with state-based restrictions and audit logging
  - Phase 1: `quickstart.md` - Setup guide with migration, implementation, and deployment checklist
- **Key Decisions**:
  - 3-tier state validation (DRAFT all fields, PUBLISHED restricted, IN_PROGRESS/COMPLETED/CANCELLED locked)
  - Hybrid ownership check (Middleware extracts JWT, Service enforces authorization)
  - Per-field audit logging with event_audit_log table
  - Async notification trigger for critical field changes (time/location on PUBLISHED events)
  - Upload-first, delete-after pattern for image replacement with rollback on transaction failure
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

### UC17: Delete Event (TienTD - Event Management)
- **Branch**: `UC17-feat-delete-event`
- **Status**: Planning phase completed
- **Plan**: `.sdd/TienTD/UC17-feat-delete-event/plan.md`
- **Artifacts**:
  - Phase 0: `research.md` - Technical research (soft delete pattern, ownership validation, application constraints, status rules, cascade behavior)
  - Phase 1: `data-model.md` - Soft delete schema with deleted_at column, validation helpers, cross-module contracts
  - Phase 1: `contracts/DELETE-events-id.md` - Complete API contract with status-based delete rules and application constraint tests
  - Phase 1: `quickstart.md` - Setup guide with migration, implementation, query filter updates, and deployment checklist
- **Key Decisions**:
  - Soft delete with `deleted_at` timestamp (preserve all data for audit trail)
  - Hybrid ownership validation (reuse UC16 pattern)
  - Status-based delete rules (allow DRAFT/PUBLISHED/CANCELLED, block IN_PROGRESS/COMPLETED)
  - Application constraint check (block deletion if any applications exist, regardless of status)
  - Prisma transaction for atomic delete + audit log
  - **CRITICAL**: ALL event queries MUST add `deleted_at: null` filter to exclude soft-deleted records
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

### UC22: View Application List (TienTD - Application Management)
- **Branch**: `022-feat-view-application-list`
- **Status**: Planning phase completed
- **Plan**: `.sdd/TienTD/UC22-feat-view-application-list/plan.md`
- **Artifacts**:
  - Phase 0: `research.md` - Technical research (organization ownership validation, pagination patterns, sensitive data filtering, status filter optimization, frontend state management)
  - Phase 1: `data-model.md` - Application entity schema with composite indexes, validation rules, DTOs for safe data exposure
  - Phase 1: `contracts/GET-events-eventId-applications.md` - Complete API contract with pagination, filtering, and organization-based access control
  - Phase 1: `quickstart.md` - Setup guide with database migration, implementation checklist, testing scenarios, troubleshooting, and deployment procedures
- **Key Decisions**:
  - Prisma nested WHERE JOIN for organization ownership validation (single atomic query)
  - Offset-based pagination with composite indexes (event_id + status + created_at DESC)
  - Database-level sensitive data filtering via Prisma select (USER_PUBLIC_PROFILE_SELECT)
  - URL query params for frontend state management (bookmarkable URLs, browser navigation support)
  - Composite indexes: `idx_applications_event_status_created`, `idx_applications_event_created`, `idx_events_org`
  - **SECURITY**: MUST NOT expose address, identity_card_number, phone_number, email in API response
  - Performance target: <1.2s for 50 records, <200ms p95 response time
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

### UC46: View Attendance List (TienTD - Attendance Management)
- **Branch**: `046-feat-view-attendance-list`
- **Status**: Planning phase completed
- **Plan**: `.sdd/TienTD/UC46-feat-view-attendance-list/plan.md`
- **Artifacts**:
  - Phase 0: `research.md` - Technical research (pagination strategy, real-time refresh, search implementation, query strategy)
  - Phase 1: `data-model.md` - NO MIGRATION REQUIRED (reuses UC22/UC24/UC45 tables), query patterns for LEFT JOIN applications→attendances
  - Phase 1: `contracts/GET-attendances-events-eventId.md` - Complete API contract for single GET endpoint with organization-based access control
  - Phase 1: `quickstart.md` - Setup guide with implementation phases, code snippets, testing scenarios
- **Key Decisions**:
  - Client-side pagination (optimal for <300 volunteers per event, Material UI DataGrid built-in support)
  - Manual refresh button with request deduplication (no auto-polling to avoid unnecessary API calls)
  - Search by volunteer name + Filter by status (Present/Absent/All) as separate controls
  - Query `applications` table WITH LEFT JOIN `attendances` to show ALL approved volunteers (checked-in + not-yet-checked-in)
  - Response includes aggregate counts (total_approved, present_count, absent_count) for dashboard display
  - **SECURITY**: FR-016 MUST NOT expose PII (address, identity_card_number, phone_number beyond public profile)
  - Performance target: <1s for 100 volunteers
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

### UC47: View Attendance History (TienTD - Attendance Management)
- **Branch**: `047-feat-view-attendance-history`
- **Status**: Phase 1 completed (ready for tasks.md generation)
- **Plan**: `.sdd/TienTD/UC47-feat-view-attendance-history/plan.md` (pending)
- **Artifacts**:
  - Phase 0: `research.md` - 4 RQs resolved (COMPLETED events only, two separate endpoints, server-side pagination, smart date defaults)
  - Phase 1: `data-model.md` - NO MIGRATION REQUIRED (reuses UC15-UC45 tables), Event-First (LEFT JOIN) vs Volunteer-First (INNER JOIN) patterns
  - Phase 1: `contracts/GET-attendances-events-eventId-history.md` - Event-First endpoint (view volunteers for completed event)
  - Phase 1: `contracts/GET-attendances-volunteers-volunteerId-history.md` - Volunteer-First endpoint (view events volunteer attended)
  - Phase 1: `quickstart.md` - Implementation guide with two-tab UI, date range picker, server-side pagination
- **Key Decisions**:
  - **COMPLETED events only** (clear separation from UC46 which shows IN_PROGRESS events)
  - **Two separate endpoints** for different query patterns (Event-First vs Volunteer-First)
  - **Server-side pagination** (limit/offset) - scalable for growing historical data (vs UC46 client-side)
  - **Smart date defaults**: Last 6 months if not specified, max range 2 years
  - **Event-First**: LEFT JOIN (shows all approved volunteers, status PRESENT/ABSENT)
  - **Volunteer-First**: INNER JOIN (shows only attended events, status always PRESENT)
  - **SECURITY**: FR-016 PII protection (only id, full_name, avatar_url exposed)
  - Performance target: <1.5s for 1000 records
- **Next Phase**: Generate tasks.md (Phase 2) via `/speckit-tasks`

<!-- SPECKIT END -->

---

**Version**: 3.1  
**Last Updated**: 2026-06-29  
**Changelog**:
- v3.1: Added Active Implementation Plans section for UC15 Add Event
- v3.0: Tái cấu trúc theo bộ khung mới - tập trung vào Architecture, ADRs và Lessons Learned
- v3.0: Thêm Anti-Patterns section và GitNexus Integration section
- v3.0: Loại bỏ duplicate content đã có trong AGENTS.md

*Tham chiếu: Xem quy trình SDD tại `CONSTITUTION.md`, Tech Stack & Domain Rules tại `AGENTS.md`, Giao kèo API tại `share_context.md`.*
