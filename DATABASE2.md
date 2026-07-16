# DATABASE2.md — Tài liệu thiết kế cơ sở dữ liệu VMS (Scope rút gọn)

**Version**: 3.0  
**Last Updated**: 2026-07-15  
**Status**: Ready for Implementation  
**Scope**: 4 Role (Volunteer, Staff, Manager, Admin) | 2 Developers

**Changelog v3.0**:

- Thu hẹp từ 19 bảng xuống còn 10 bảng
- Xóa các module: Organization, Attendance, Certificate, Feedback, Notification, Donation, Payment
- Enum UserRole: bỏ GUEST
- Thêm EventCategoryType, EmailVerificationType
- Thêm bảng email_verifications (thay cho password_resets cũ)

---

## 1. Tổng quan

### 1.1 Phạm vi dự án

Hệ thống Quản lý Tình nguyện viên (VMS) sau khi thu hẹp chỉ phục vụ **4 vai trò**:

| Role | Trách nhiệm chính |
|------|-------------------|
| **Volunteer** | Đăng ký tài khoản, quản lý kỹ năng, xem & đăng ký Event, theo dõi trạng thái đơn |
| **Staff** | CRUD Event, gửi Event lên Manager duyệt, xem & xử lý đơn đăng ký |
| **Manager** | Duyệt / từ chối Event, CRUD Event Category, CRUD Skill |
| **Admin** | CRUD User, phân quyền Role, khóa / mở khóa tài khoản |

### 1.2 Các module đã bị xóa

Các module sau **không còn** trong scope mới:

- ❌ Organization
- ❌ Attendance
- ❌ Certificate
- ❌ Feedback
- ❌ Notification + NotificationType
- ❌ Donation + PaymentTransaction
- ❌ ApplicationStatusHistory
- ❌ PasswordReset (đã gộp vào EmailVerification)

### 1.3 Stack công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Database | MySQL 8.x |
| ORM | Prisma |
| Backend | Node.js + Express 5.x |
| Auth | JWT HttpOnly Cookie + bcryptjs |

### 1.4 File schema tham chiếu

- `backend/prisma/schema.prisma` — Schema gốc (19 bảng, giữ nguyên làm lịch sử)
- `backend/prisma/schema2.prisma` — Schema rút gọn (10 bảng), là nguồn chính cho tài liệu này
- `DATABASE.md` — Tài liệu gốc (v1.0/v2.0, 1718 dòng)
- `DATABASE2.md` — Tài liệu này

---

## 2. Sơ đồ quan hệ (ERD)

### 2.1 Danh sách 10 bảng

| # | Bảng | Mục đích | Soft Delete |
|---|------|----------|-------------|
| 1 | `roles` | Danh mục vai trò người dùng | Không |
| 2 | `users` | Tài khoản người dùng | ✅ `is_active` |
| 3 | `user_sessions` | Phiên đăng nhập (single session) | Hết hạn tự động |
| 4 | `login_attempts` | Chống brute-force đăng nhập | Không |
| 5 | `email_verifications` | Xác thực email (OTP) & reset password | Không |
| 6 | `skills` | Danh mục kỹ năng tình nguyện | ✅ `is_active` |
| 7 | `user_skills` | Liên kết User ↔ Skill (N-N) | Không |
| 8 | `event_categories` | Phân loại sự kiện | ✅ `is_active` |
| 9 | `events` | Sự kiện tình nguyện | ✅ `is_active` |
| 10 | `applications` | Đơn đăng ký tham gia sự kiện | State-based |

### 2.2 Mô tả quan hệ

```
roles (1) ────< (N) users
users (1) ────< (N) user_skills >──── (1) skills
users (1) ────< (N) applications >──── (1) events
users (1) ────< (N) events (created_by)
users (1) ────< (N) events (approved_by)
event_categories (1) ────< (N) events
users (1) ──── (1) user_sessions
```

**Chi tiết quan hệ**:

- `users.role_id` → `roles.id` (Mỗi user có 1 role)
- `users` → `user_sessions` (1-1, mỗi user có tối đa 1 session active)
- `users` → `user_skills` (1-N, một user có nhiều kỹ năng)
- `skills` → `user_skills` (1-N, một kỹ năng thuộc nhiều user)
- `users` → `applications` (1-N, quan hệ "người nộp đơn")
- `users` → `applications` (1-N, quan hệ "người xử lý đơn")
- `events` → `applications` (1-N, một event có nhiều đơn đăng ký)
- `users` → `events` (1-N, quan hệ "staff tạo event")
- `users` → `events` (1-N, quan hệ "manager duyệt event")
- `event_categories` → `events` (1-N, một category có nhiều event)

---

## 3. Chi tiết từng bảng

### 3.1 roles

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID vai trò |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tên vai trò (VOLUNTEER, STAFF, MANAGER, ADMIN) |
| `description` | VARCHAR(255) | NULL | Mô tả vai trò |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |

**Seed data**:

```sql
INSERT INTO roles (name, description) VALUES
  ('VOLUNTEER', 'Tình nguyện viên - tham gia sự kiện'),
  ('STAFF',     'Nhân viên - tạo và quản lý sự kiện'),
  ('MANAGER',   'Quản lý - duyệt sự kiện và quản lý danh mục'),
  ('ADMIN',     'Quản trị viên - quản lý người dùng và phân quyền');
```

---

### 3.2 users

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID người dùng |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt, 12 rounds) |
| `full_name` | VARCHAR(255) | NOT NULL | Họ tên đầy đủ |
| `phone` | VARCHAR(20) | NULL | Số điện thoại |
| `avatar_url` | VARCHAR(500) | NULL | URL ảnh đại diện (Cloudinary) |
| `role_id` | INT | FK → roles.id, NOT NULL | Vai trò |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Trạng thái kích hoạt (soft delete) |
| `email_verified` | BOOLEAN | NOT NULL, DEFAULT FALSE | Email đã xác thực? |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**Index**:

- `idx_users_role_id` trên `role_id`
- `idx_users_is_active` trên `is_active`
- `idx_users_email_verified` trên `email_verified`

**Quan hệ**:

- `role` → `roles` (N-1)
- `session` → `user_sessions` (1-1)
- `applicationsSubmitted` → `applications` (1-N, người nộp đơn)
- `applicationsProcessed` → `applications` (1-N, người xử lý đơn)
- `userSkills` → `user_skills` (1-N)
- `eventsCreated` → `events` (1-N, staff tạo)
- `eventsApproved` → `events` (1-N, manager duyệt)

---

### 3.3 user_sessions

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID session |
| `user_id` | INT | FK → users.id, UNIQUE, ON DELETE CASCADE | ID user |
| `jti` | VARCHAR(255) | NOT NULL | JWT ID (dùng để revoke token) |
| `expires_at` | DATETIME | NOT NULL | Thời điểm hết hạn session |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |

**Index**: `idx_user_sessions_jti` trên `jti`, `idx_user_sessions_expires_at` trên `expires_at`

**Chính sách Single Session**: `user_id` là UNIQUE → mỗi user chỉ có 1 session active. Khi đăng nhập ở thiết bị mới, session cũ bị ghi đè.

---

### 3.4 login_attempts

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID bản ghi |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email bị theo dõi |
| `attempts` | INT | NOT NULL, DEFAULT 0 | Số lần thử thất bại |
| `locked_until` | DATETIME | NULL | Thời điểm mở khóa (NULL = không bị khóa) |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**Index**: `idx_login_attempts_locked_until` trên `locked_until`

**Lưu ý**: KHÔNG có FK đến users — bảng này theo dõi theo email để tránh user enumeration attack.

---

### 3.5 email_verifications

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID bản ghi |
| `email` | VARCHAR(255) | NOT NULL | Email cần xác thực |
| `otp_hash` | VARCHAR(255) | NOT NULL | OTP đã hash |
| `type` | ENUM(REGISTER, RESET_PASSWORD) | NOT NULL, DEFAULT REGISTER | Loại xác thực |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `last_sent_at` | DATETIME | NULL | Lần gửi OTP gần nhất |
| `attempts` | INT | NOT NULL, DEFAULT 0 | Số lần thử OTP |
| `is_locked` | BOOLEAN | NOT NULL, DEFAULT FALSE | OTP bị khóa tạm thời? |
| `locked_until` | DATETIME | NULL | Thời điểm mở khóa OTP |

**Unique constraint**: `(email, type)` — mỗi email chỉ có 1 bản ghi cho mỗi loại xác thực

**Index**: `idx_email_verifications_email` trên `email`, `idx_email_verifications_created_at` trên `created_at`, `idx_email_verifications_locked_until` trên `locked_until`

---

### 3.6 skills

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID kỹ năng |
| `name` | VARCHAR(255) | UNIQUE, NOT NULL | Tên kỹ năng |
| `description` | TEXT | NULL | Mô tả kỹ năng |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**Index**: `idx_skills_is_active` trên `is_active`

**Quyền**: Chỉ **Manager** được CRUD Skill.

---

### 3.7 user_skills

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID liên kết |
| `user_id` | INT | FK → users.id, ON DELETE CASCADE | ID user |
| `skill_id` | INT | FK → skills.id, ON DELETE CASCADE | ID skill |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |

**Unique constraint**: `(user_id, skill_id)` — mỗi user chỉ có 1 lần liên kết đến 1 skill

**Index**: `idx_user_skills_user_id` trên `user_id`, `idx_user_skills_skill_id` trên `skill_id`

---

### 3.8 event_categories

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID danh mục |
| `name` | VARCHAR(255) | NOT NULL | Tên danh mục |
| `category_type` | ENUM(LOCATION, TIME, TYPE) | NOT NULL | Loại phân loại |
| `description` | TEXT | NULL | Mô tả |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**Unique constraint**: `(name, category_type)` — không trùng tên trong cùng loại

**Index**: `idx_event_categories_type_active` trên `(category_type, is_active)`

**Quyền**: Chỉ **Manager** được CRUD EventCategory.

---

### 3.9 events

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID sự kiện |
| `title` | VARCHAR(500) | NOT NULL | Tiêu đề sự kiện |
| `description` | TEXT | NOT NULL | Mô tả chi tiết |
| `location` | VARCHAR(500) | NOT NULL | Địa điểm tổ chức |
| `start_date` | DATETIME | NOT NULL | Ngày bắt đầu |
| `end_date` | DATETIME | NOT NULL | Ngày kết thúc |
| `application_deadline` | DATETIME | NOT NULL | Hạn cuối đăng ký |
| `max_capacity` | INT | NOT NULL | Sức chứa tối đa |
| `approved_participants` | INT | NOT NULL, DEFAULT 0 | Số người đã được duyệt |
| `image_url` | VARCHAR(500) | NULL | Ảnh sự kiện (Cloudinary) |
| `category_id` | INT | FK → event_categories.id, NOT NULL | Danh mục |
| `created_by` | INT | FK → users.id, NOT NULL | Staff tạo event |
| `approved_by` | INT | FK → users.id, NULL | Manager duyệt event |
| `approved_at` | DATETIME | NULL | Ngày duyệt |
| `rejected_reason` | TEXT | NULL | Lý do từ chối |
| `status` | ENUM | NOT NULL, DEFAULT DRAFT | Trạng thái event |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**EventStatus Enum**: `DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

**Index**:

- `idx_events_category_id` trên `category_id`
- `idx_events_created_by` trên `created_by`
- `idx_events_approved_by` trên `approved_by`
- `idx_events_status_active` trên `(status, is_active)`
- `idx_events_start_date` trên `start_date`
- `idx_events_app_deadline` trên `application_deadline`
- `idx_events_category_status_active_date` trên `(category_id, status, is_active, start_date)`

**Quan hệ**:

- `category` → `event_categories` (N-1)
- `createdByUser` → `users` (N-1, Staff)
- `approvedByUser` → `users` (N-1, Manager, nullable)
- `applications` → `applications` (1-N)

**Domain Rules**:

1. `approved_participants <= max_capacity` (bất biến)
2. Không sửa core info khi event đang `IN_PROGRESS` hoặc `COMPLETED`
3. Chỉ event `PUBLISHED` mới hiển thị cho Volunteer
4. `approved_participants` tăng khi duyệt application, giảm khi hủy application đã approved

---

### 3.10 applications

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID đơn đăng ký |
| `user_id` | INT | FK → users.id, NOT NULL | Volunteer nộp đơn |
| `event_id` | INT | FK → events.id, NOT NULL | Event đăng ký |
| `status` | ENUM | NOT NULL, DEFAULT PENDING | Trạng thái đơn |
| `message` | TEXT | NULL | Lời nhắn / lý do đăng ký |
| `processed_by` | INT | FK → users.id, NULL | Staff xử lý đơn |
| `processed_at` | DATETIME | NULL | Ngày xử lý |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày nộp |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**ApplicationStatus Enum**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

**Unique constraint**: `(user_id, event_id)` — mỗi user chỉ được nộp 1 đơn cho 1 event

**Index**:

- `idx_applications_user_status` trên `(user_id, status)`
- `idx_applications_event_status` trên `(event_id, status)`
- `idx_applications_processed_by` trên `processed_by`

**Quan hệ**:

- `submittedByUser` → `users` (N-1, Volunteer nộp đơn)
- `event` → `events` (N-1)
- `processedByUser` → `users` (N-1, Staff xử lý, nullable)

**Domain Rules**:

1. Luồng một chiều: `PENDING` → `APPROVED` hoặc `REJECTED`, không quay lại
2. Chỉ user `is_active: true` mới được tạo application
3. Chỉ event `PUBLISHED` mới nhận đơn đăng ký
4. `CANCELLED` chỉ do Volunteer tự hủy khi đơn còn `PENDING`

---

## 4. Luồng nghiệp vụ

### 4.1 Luồng tạo Event

```
Staff tạo Event (status = DRAFT)
    ↓
Staff chỉnh sửa Event (DRAFT)
    ↓
Staff gửi duyệt (status = PENDING_APPROVAL)
    ↓
Manager duyệt (status = PUBLISHED, approved_by, approved_at) HOẶC từ chối (status = REJECTED, rejected_reason)
    ↓ (nếu PUBLISHED)
Volunteer nhìn thấy Event trong danh sách
```

### 4.2 Luồng đăng ký tham gia

```
Volunteer xem danh sách Event (status = PUBLISHED)
    ↓
Volunteer nộp đơn (application status = PENDING)
    ↓
Staff xem danh sách đơn của Event
    ↓
Staff duyệt (status = APPROVED, processed_by, processed_at)
    HOẶC từ chối (status = REJECTED, processed_by, processed_at)
    ↓ (nếu APPROVED)
Event.approved_participants + 1
```

### 4.3 Luồng quản lý danh mục

```
Manager CRUD EventCategory (LOCATION / TIME / TYPE)
Manager CRUD Skill
```

### 4.4 Luồng quản trị hệ thống

```
Admin CRUD User
Admin gán Role cho User
Admin khóa / mở khóa User (is_active = false/true)
```

---

## 5. Quy tắc bất biến (Immutability Rules)

| Bảng | Rule | Lý do |
|------|------|-------|
| `events` | Không sửa core info khi `status IN ('IN_PROGRESS', 'COMPLETED')` | Tránh sai lệch dữ liệu sự kiện đang/cũ |
| `applications` | `PENDING → APPROVED/REJECTED` là một chiều | Audit trail |
| `applications` | `PENDING → CANCELLED` chỉ do Volunteer | Volunteer tự hủy |
| `users` | Không xóa cứng, dùng `is_active = false` | Soft delete |

**Cơ chế thực thi**: Service layer validate trước khi UPDATE.

---

## 6. Index & Hiệu năng

### 6.1 Composite Index quan trọng

```sql
-- Lọc Event theo category + status + active + ngày bắt đầu
INDEX idx_events_category_status_active_date ON events(category_id, status, is_active, start_date);

-- Lọc Application của user theo status
INDEX idx_applications_user_status ON applications(user_id, status);

-- Lọc Application của event theo status
INDEX idx_applications_event_status ON applications(event_id, status);

-- Lọc Category theo type + active
INDEX idx_event_categories_type_active ON event_categories(category_type, is_active);
```

### 6.2 Query thường gặp

| Query | Index sử dụng | Tần suất |
|-------|--------------|----------|
| Danh sách Event PUBLISHED cho Volunteer | `idx_events_status_active`, `idx_events_category_status_active_date` | Cao |
| Đơn đăng ký của tôi (Volunteer) | `idx_applications_user_status` | Cao |
| Đơn đăng ký của Event (Staff) | `idx_applications_event_status` | Cao |
| Đăng nhập (check email) | `users.email` UNIQUE | Rất cao |

---

## 7. Phân quyền theo Role

| Thao tác | Volunteer | Staff | Manager | Admin |
|-----------|:---------:|:-----:|:-------:|:-----:|
| **Users** | | | | |
| Đọc own profile | ✅ | ✅ | ✅ | ✅ |
| Cập nhật own profile | ✅ | ✅ | ✅ | ✅ |
| CRUD (admin) | | | | ✅ |
| Khóa / Mở khóa | | | | ✅ |
| Gán Role | | | | ✅ |
| **Skills** | | | | |
| Đọc | ✅ | ✅ | ✅ | ✅ |
| CRUD | | | ✅ | |
| Gán skill cho bản thân | ✅ | | | |
| **Event Categories** | | | | |
| Đọc | ✅ | ✅ | ✅ | ✅ |
| CRUD | | | ✅ | |
| **Events** | | | | |
| Đọc (PUBLISHED only) | ✅ | ✅ | ✅ | ✅ |
| Đọc (all status) | | ✅ | ✅ | ✅ |
| Tạo (DRAFT) | | ✅ | | |
| Sửa (DRAFT) | | ✅ | | |
| Xóa (DRAFT, soft delete) | | ✅ | | |
| Gửi duyệt (DRAFT → PENDING_APPROVAL) | | ✅ | | |
| Duyệt / Từ chối | | | ✅ | |
| **Applications** | | | | |
| Nộp đơn (tạo) | ✅ | | | |
| Hủy đơn (PENDING → CANCELLED) | ✅ | | | |
| Xem đơn của chính mình | ✅ | | | |
| Xem đơn của Event | | ✅ | ✅ | |
| Duyệt / Từ chối đơn | | ✅ | | |

---

## 8. Migration Order

Thứ tự tạo bảng khi migrate:

### Phase 1: Master Data

1. `001_create_roles.sql`

### Phase 2: Core Entities

2. `002_create_users.sql`
2. `003_create_skills.sql`
3. `004_create_event_categories.sql`

### Phase 3: Auth & Session

5. `005_create_user_sessions.sql`
2. `006_create_login_attempts.sql`
3. `007_create_email_verifications.sql`

### Phase 4: User Relations

8. `008_create_user_skills.sql`

### Phase 5: Events & Applications

9. `009_create_events.sql`
2. `010_create_applications.sql`

---

## 9. Prisma Schema Reference

### 9.1 File schema

- File chính: `backend/prisma/schema2.prisma`
- File gốc (lưu lịch sử): `backend/prisma/schema.prisma`

### 9.2 Commands

```bash
# Generate Prisma Client từ schema2.prisma
npx prisma generate --schema=prisma/schema2.prisma

# Format schema
npx prisma format --schema=prisma/schema2.prisma

# Validate schema
npx prisma validate --schema=prisma/schema2.prisma

# Tạo migration
npx prisma migrate dev --name <migration_name> --schema=prisma/schema2.prisma

# Apply migrations
npx prisma migrate deploy --schema=prisma/schema2.prisma
```

### 9.3 Conventions

- **Database tables**: `snake_case` (e.g., `user_skills`)
- **Prisma models**: `PascalCase` (e.g., `UserSkill`)
- **Mapping**: `@@map("user_skills")`
- **Enums**: `PascalCase` value (e.g., `PENDING_APPROVAL`)
- **Timestamps**: `@default(now())` cho `created_at`, `@updatedAt` cho `updated_at`

---

## 10. Security Checklist

- [x] Passwords MUST be bcrypt hashed (12 rounds)
- [x] JWT stored in HttpOnly cookies ONLY
- [x] API responses MUST NOT include `password_hash`, `jti`
- [x] Soft delete cho User, Event, Category, Skill
- [x] Login attempt lockout sau 5 lần thất bại
- [x] Email verification với OTP (chống brute-force: lock sau 3 lần sai)
- [x] Single session enforcement (`user_sessions.user_id` UNIQUE)
- [x] Foreign key constraints enabled
- [x] Input validation với Zod trước khi vào database
- [x] SQL injection prevention qua Prisma parameterized queries

---

**End of DATABASE2.md**

**Version**: 3.0  
**Status**: Ready for Implementation  
**Last Updated**: 2026-07-15

**Tham chiếu**: `AGENTS.md`, `CLAUDE.md`, `backend/prisma/schema2.prisma`, `DATABASE.md`
