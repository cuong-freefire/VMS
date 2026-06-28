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

**Xem bảng phân công tại `docs\VMS_project_overview_updated.md` Section 1.**

| Member | Module | Use Cases | Responsibilities |
|--------|--------|-----------|------------------|
| **Member 1 - CuongLH** | Authentication + Profile + Email | UC01-07, UC18-21, UC62-66 | Login/Register/Logout, Password Management, User Profile CRUD, Volunteer Skills, Volunteer History, Email Verification & Notifications |
| **Member 2 - NamLD** | Volunteer Event Features | UC08-14, UC48, UC51-52 | Event List/Detail/Search/Filter (Volunteer view), Apply Event, Cancel Application, Submit Feedback, View/Download Certificate |
| **Member 3 - TienTD** | Event & Application Management (Staff) | UC15-17, UC22-25, UC45-47, UC49-50, UC53 | Event CRUD (Staff), Application Approval/Rejection, Attendance Check, View Feedback, Generate Certificate |
| **Member 4 - AnhND** | Admin & Manager Tools | UC26-36 | User Management (CRUD + Filter), Category Management, Skill Management |
| **Member 5 - DucNM** | Organization + Notification + Dashboard + Payment | UC37-44, UC54-61 | Organization CRUD, Notification System, Dashboard/Reports/Statistics, Donation & Payment Gateway |

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
| Utility | camelCase `.js` | `formatDate.js` |

### Backend Structure

```text
backend/
├── src/
│   ├── app.js            # Express app configuration
│   ├── server.js         # Server entry point
│   ├── swagger-server.js # Swagger documentation server
│   ├── config/           # Logger, Swagger config
│   ├── controllers/      # HTTP layer (auth.controller.js, event.controller.js)
│   ├── services/         # Business logic (auth.service.js, event.service.js)
│   ├── repositories/     # Data access layer (Prisma)
│   ├── middleware/       # Auth, logger middleware
│   ├── middlewares/      # Additional middlewares
│   ├── routes/           # API route definitions (auth.routes.js, event.routes.js)
│   ├── utils/            # Helper functions (jwt.util.js, response.util.js)
│   └── seeds/            # Database seed files
├── prisma/               # Prisma schema and migrations
├── public/               # Static files
└── tests/                # Jest + Supertest integration tests
```

### Frontend Structure

```text
frontend/
├── public/               # Static files
├── src/
│   ├── index.js          # React app entry point
│   ├── App.js            # Main App component
│   ├── index.css         # Global styles
│   ├── api/              # Axios clients (axiosApi.js, eventApi.js)
│   ├── assets/           # Images, fonts, static assets
│   ├── components/       # Reusable UI components
│   │   ├── layouts/      # Layout components (Header, Footer, Sidebar)
│   │   ├── pages/        # Page-level components
│   │   └── ui/           # UI components (buttons, inputs, cards)
│   ├── contexts/         # React Context (authContext.context.js)
│   ├── hooks/            # Custom React hooks (useAuth.js, useNotification.js)
│   ├── mock_datas/       # Mock data for development
│   ├── services/         # Service layer (auth.service.js, event.service.js)
│   └── utils/            # Frontend utilities
└── tests/                # Jest + React Testing Library
```

### Spec Structure

```text
.sdd/
└── specs/
    ├── feat-authentication/
    │   ├── CONTEXT.md    # Problem statement, constraints
    │   ├── SPEC.md       # Feature specification (EARS notation)
    │   ├── PLAN.md       # Implementation plan
    │   └── TASKS.md      # Atomic tasks with dependencies
    ├── feat-event-management/
    └── feat-donation/
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

**Status**: ⚠️ Planned (chưa implement)

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

# Future: Cloudinary integration
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Future: Payment gateway integration
PAYMENT_GATEWAY_API_KEY=your-key
PAYMENT_GATEWAY_SECRET=your-secret
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

## 8. VMS Domain Rules

### Event & Application Management

1. Event capacity MUST be enforced at Service layer with transaction lock
2. Application state transitions follow FSM: `Pending → [Approved | Rejected]` (one-way only)
3. Soft delete for Event/User/Organization to preserve audit trail
4. Staff can only manage events they created (ownership check required)

### Attendance & Check-in

1. Check-in only allowed if Application status = `Approved`
2. QR code generation MUST be server-side with expiry timestamp
3. Duplicate check-in prevention via unique constraint on `(application_id, check_in_time)`
4. Attendance records are immutable (no UPDATE/DELETE after creation)

### Donation & Payment

1. All donation amounts MUST be validated server-side
2. Donation history is immutable (no UPDATE/DELETE)
3. Payment gateway integration MUST use server-side signature verification
4. Failed payment attempts MUST be logged for audit

### Notification System

1. Notifications MUST be sent asynchronously (queue-based)
2. Email delivery failures MUST be logged but not block main flow
3. Notification preferences MUST be respected (opt-in/opt-out)
4. Critical notifications (event approval, certificate) have retry logic

### Certificate Generation

1. Certificates only generated for `Approved` applications with attendance records
2. Certificate URL MUST be stored in database (not regenerated each time)
3. Certificate templates MUST support localization (Vietnamese/English)

## 9. GitNexus Integration

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

**Version**: 3.1  
**Last Updated**: 2026-06-28  
**Changelog**:

- v3.1: Cập nhật Module Ownership theo phân công 5 members (66 use cases)
- v3.1: Thêm VMS Domain Rules section (Event, Attendance, Donation, Notification, Certificate)
- v3.1: Cập nhật Environment Variables (loại bỏ VNPAY, thêm generic Payment Gateway)
- v3.1: Sửa file examples (formatCurrency.js → formatDate.js)

*Tham chiếu: Xem quy trình SDD tại `CONSTITUTION.md`, Tech Stack & Domain Rules tại `AGENTS.md`, Giao kèo API + Hàm phụ thuộc tại `share_context.md`.*
