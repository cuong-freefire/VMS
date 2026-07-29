# DATABASE2.md — Tài liệu thiết kế cơ sở dữ liệu VMS (Scope rút gọn)

**Version**: 4.0  
**Last Updated**: 2026-07-27  
**Status**: Ready for Implementation  
**Scope**: 4 Role (Volunteer, Staff, Manager, Admin) | 2 Developers

**Changelog v4.0**:

- Thêm module VNPay Payment
- Bổ sung bảng `payment_transactions` (11 bảng)
- Thêm enum `PaymentStatus`, `WAITING_PAYMENT`, `PAYMENT_EXPIRED`
- Thêm cột `is_paid`, `price`, `rejected_by`, `rejected_at` vào `events`
- Thêm cột `payment_expires_at` vào `applications`
- Cập nhật luồng đăng ký: hỗ trợ Event có phí và miễn phí

**Changelog v3.0**:

- Thu hẹp từ 19 bảng xuống còn 10 bảng
- Xóa các module: Organization, Attendance, Certificate, Feedback, Notification, Donation
- Enum UserRole: bỏ GUEST
- Thêm EventCategoryType, EmailVerificationType
- Thêm bảng email_verifications (thay cho password_resets cũ)

---

## 1. Tổng quan

### 1.1 Phạm vi dự án

Hệ thống Quản lý Tình nguyện viên (VMS) sau khi thu hẹp chỉ phục vụ **4 vai trò**:

| Role | Trách nhiệm chính |
| ------ | ------------------- |
| **Volunteer** | Đăng ký tài khoản, quản lý kỹ năng, xem & đăng ký Event, thanh toán phí Event (qua VNPay), theo dõi trạng thái đơn |
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
- ❌ Donation
- ❌ ApplicationStatusHistory
- ❌ PasswordReset (đã gộp vào EmailVerification)

### 1.3 Stack công nghệ

| Lớp | Công nghệ |
| ----- | ----------- |
| Database | MySQL 8.x |
| ORM | Prisma |
| Backend | Node.js + Express 5.x |
| Auth | JWT HttpOnly Cookie + bcryptjs |
| Payment | VNPay |

### 1.4 File schema tham chiếu

- `backend/prisma/schema.prisma` — Schema chính (11 bảng), là nguồn chính cho tài liệu này
- `DATABASE.md` — Tài liệu gốc (v1.0/v2.0, 1718 dòng)
- `DATABASE2.md` — Tài liệu này

---

## 2. Sơ đồ quan hệ (ERD)

### 2.1 Danh sách 11 bảng

| # | Bảng | Mục đích | Soft Delete |
| --- | ------ | ---------- | ------------- |
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
| 11 | `payment_transactions` | Giao dịch thanh toán VNPay | Immutable |

### 2.2 Mô tả quan hệ

```
roles (1) ────< (N) users
users (1) ────< (N) user_skills >──── (1) skills
users (1) ────< (N) applications >──── (1) events
users (1) ────< (N) events (created_by)
users (1) ────< (N) events (approved_by)
users (1) ────< (N) events (rejected_by)
event_categories (1) ────< (N) events
users (1) ──── (1) user_sessions
applications (1) ──── (1) payment_transactions
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
- `users` → `events` (1-N, quan hệ "manager từ chối event")
- `event_categories` → `events` (1-N, một category có nhiều event)
- `applications` → `payment_transactions` (1-1, mỗi application có tối đa 1 giao dịch)

---

## 3. Chi tiết từng bảng

### 3.1 roles

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
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
- `eventsRejected` → `events` (1-N, manager từ chối)

---

### 3.3 user_sessions

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
| `id` | INT | PK, AUTO_INCREMENT | ID liên kết |
| `user_id` | INT | FK → users.id, ON DELETE CASCADE | ID user |
| `skill_id` | INT | FK → skills.id, ON DELETE CASCADE | ID skill |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |

**Unique constraint**: `(user_id, skill_id)` — mỗi user chỉ có 1 lần liên kết đến 1 skill

**Index**: `idx_user_skills_user_id` trên `user_id`, `idx_user_skills_skill_id` trên `skill_id`

---

### 3.8 event_categories

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| ----- | ------------- | ----------- | ------- |
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
| ----- | ------------- | ----------- | ------- |
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
| `is_paid` | BOOLEAN | NOT NULL, DEFAULT FALSE | Event có phí? (FALSE = miễn phí) |
| `price` | INT | NULL | Phí tham gia (VND). NULL khi is_paid = FALSE |
| `category_id` | INT | FK → event_categories.id, NOT NULL | Danh mục |
| `created_by` | INT | FK → users.id, NOT NULL | Staff tạo event |
| `approved_by` | INT | FK → users.id, NULL | Manager duyệt event |
| `approved_at` | DATETIME | NULL | Ngày duyệt |
| `rejected_by` | INT | FK → users.id, NULL | Manager từ chối event |
| `rejected_at` | DATETIME | NULL | Ngày từ chối |
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
- `idx_events_rejected_by` trên `rejected_by`
- `idx_events_status_active` trên `(status, is_active)`
- `idx_events_start_date` trên `start_date`
- `idx_events_app_deadline` trên `application_deadline`
- `idx_events_category_status_active_date` trên `(category_id, status, is_active, start_date)`

**Quan hệ**:

- `category` → `event_categories` (N-1)
- `createdByUser` → `users` (N-1, Staff)
- `approvedByUser` → `users` (N-1, Manager, nullable)
- `rejectedByUser` → `users` (N-1, Manager, nullable)
- `applications` → `applications` (1-N)

**Domain Rules**:

1. `approved_participants <= max_capacity` (bất biến)
2. Không sửa core info khi event đang `IN_PROGRESS` hoặc `COMPLETED`
3. Chỉ event `PUBLISHED` mới hiển thị cho Volunteer
4. `approved_participants` tăng khi duyệt application, giảm khi hủy application đã approved
5. Khi `is_paid = TRUE`, `price` phải > 0. Khi `is_paid = FALSE`, `price` phải là NULL
6. `is_paid` và `price` chỉ được set khi tạo Event, không thay đổi sau khi PUBLISHED

---

### 3.10 applications

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| ----- | ------------- | ----------- | ------- |
| `id` | INT | PK, AUTO_INCREMENT | ID đơn đăng ký |
| `user_id` | INT | FK → users.id, NOT NULL | Volunteer nộp đơn |
| `event_id` | INT | FK → events.id, NOT NULL | Event đăng ký |
| `status` | ENUM | NOT NULL, DEFAULT PENDING | Trạng thái đơn |
| `message` | TEXT | NULL | Lời nhắn / lý do đăng ký |
| `processed_by` | INT | FK → users.id, NULL | Staff xử lý đơn |
| `processed_at` | DATETIME | NULL | Ngày xử lý |
| `payment_expires_at` | DATETIME | NULL | Hạn thanh toán (chỉ dùng khi status = WAITING_PAYMENT) |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày nộp |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**ApplicationStatus Enum**: `PENDING`, `WAITING_PAYMENT`, `APPROVED`, `REJECTED`, `CANCELLED`, `PAYMENT_EXPIRED`

**Unique constraint**: `(user_id, event_id)` — mỗi user chỉ được nộp 1 đơn cho 1 event

**Index**:

- `idx_applications_user_status` trên `(user_id, status)`
- `idx_applications_event_status` trên `(event_id, status)`
- `idx_applications_processed_by` trên `processed_by`

**Quan hệ**:

- `submittedByUser` → `users` (N-1, Volunteer nộp đơn)
- `event` → `events` (N-1)
- `processedByUser` → `users` (N-1, Staff xử lý, nullable)
- `payment` → `payment_transactions` (1-1, nullable)

**Domain Rules**:

1. Luồng miễn phí (event.is_paid = FALSE): `PENDING` → `APPROVED` hoặc `REJECTED`, không quay lại
2. Luồng có phí (event.is_paid = TRUE): `PENDING` → `WAITING_PAYMENT` → (thanh toán thành công) → `APPROVED`; hoặc `WAITING_PAYMENT` → `PAYMENT_EXPIRED` (quá hạn)
3. Chỉ user `is_active: true` mới được tạo application
4. Chỉ event `PUBLISHED` mới nhận đơn đăng ký
5. `CANCELLED` chỉ do Volunteer tự hủy khi đơn ở `PENDING`, `WAITING_PAYMENT`, `APPROVED`, hoặc `PAYMENT_EXPIRED`. Khi hủy `WAITING_PAYMENT`: payment transaction → `FAILED`. Khi hủy `APPROVED`: `approved_participants` giảm 1.
6. `WAITING_PAYMENT` → `APPROVED` chỉ khi PaymentTransaction có status = `SUCCESS`
7. `WAITING_PAYMENT` → `PAYMENT_EXPIRED` khi `payment_expires_at` < NOW() (xử lý bởi scheduled job hoặc trigger khi Volunteer truy cập)

---

### 3.11 payment_transactions

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| ----- | ------------- | ----------- | ------- |
| `id` | INT | PK, AUTO_INCREMENT | ID giao dịch |
| `application_id` | INT | FK → applications.id, UNIQUE, NOT NULL | Đơn đăng ký liên quan |
| `vnp_txn_ref` | VARCHAR(100) | UNIQUE, NOT NULL | Mã tham chiếu gửi VNPay (`vnp_TxnRef`) |
| `vnp_transaction_no` | VARCHAR(100) | NULL | Mã giao dịch VNPay trả về qua IPN (`vnp_TransactionNo`) |
| `amount` | INT | NOT NULL | Số tiền (VND) |
| `bank_code` | VARCHAR(50) | NULL | Mã ngân hàng thanh toán (`vnp_BankCode`) |
| `pay_date` | DATETIME | NULL | Thời gian thanh toán từ VNPay (`vnp_PayDate`) |
| `response_code` | VARCHAR(10) | NULL | Mã phản hồi từ VNPay (`vnp_ResponseCode`, `00` = success) |
| `status` | ENUM | NOT NULL, DEFAULT PENDING | Trạng thái giao dịch |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | DATETIME | NOT NULL, ON UPDATE NOW() | Ngày cập nhật |

**PaymentStatus Enum**: `PENDING`, `SUCCESS`, `FAILED`

**Index**:

- `idx_payment_transactions_application_id` trên `application_id`
- `idx_payment_transactions_vnp_txn_ref` trên `vnp_txn_ref`
- `idx_payment_transactions_status` trên `status`

**Quan hệ**:

- `application` → `applications` (N-1, unique → 1-1 thực tế)

**Domain Rules**:

1. **Bất biến**: Giao dịch sau khi chuyển sang `SUCCESS` là dữ liệu bất biến. TUYỆT ĐỐI KHÔNG sửa `amount`, `status`, hoặc các trường VNPay
2. **Luồng trạng thái**: `PENDING` → `SUCCESS` (qua IPN callback) hoặc `PENDING` → `FAILED` (timeout/lỗi)
3. **Rollback**: Giao dịch lỗi hoặc timeout phải chuyển sang `FAILED`, không được kẹt vĩnh viễn ở `PENDING`
4. **1-1 với Application**: Mỗi Application chỉ có tối đa 1 PaymentTransaction
5. **Đối soát IPN**: `vnp_transaction_no` và `response_code` được ghi nhận từ VNPay IPN callback, dùng để đối soát giao dịch

---

## 4. Luồng nghiệp vụ

### 4.1 Luồng tạo Event

```
Staff tạo Event (status = DRAFT, set is_paid + price nếu có phí)
    ↓
Staff chỉnh sửa Event (DRAFT)
    ↓
Staff gửi duyệt (status = PENDING_APPROVAL)
    ↓
Manager duyệt (status = PUBLISHED, approved_by, approved_at) HOẶC từ chối (status = REJECTED, rejected_by, rejected_at, rejected_reason)
    ↓ (nếu PUBLISHED)
Volunteer nhìn thấy Event trong danh sách
```

### 4.2 Luồng đăng ký tham gia — Event miễn phí

```
Volunteer xem danh sách Event (status = PUBLISHED, is_paid = FALSE)
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

### 4.3 Luồng đăng ký tham gia — Event có phí

```
Volunteer xem danh sách Event (status = PUBLISHED, is_paid = TRUE, hiển thị giá)
    ↓
Volunteer nộp đơn (application status = PENDING)
    ↓
Staff xem danh sách đơn của Event
    ↓
Staff duyệt (status = WAITING_PAYMENT, processed_by, processed_at, payment_expires_at = NOW() + 15 phút)
    HOẶC từ chối (status = REJECTED, processed_by, processed_at)
    ↓ (nếu WAITING_PAYMENT)
Hệ thống tạo PaymentTransaction (status = PENDING, vnp_txn_ref = unique)
    ↓
Volunteer được redirect sang VNPay để thanh toán
    ↓
┌─ Thanh toán thành công (VNPay IPN callback)
│   PaymentTransaction.status = SUCCESS (cập nhật vnp_transaction_no, bank_code, pay_date, response_code)
│   Application.status = APPROVED
│   Event.approved_participants + 1
│
└─ Quá hạn (payment_expires_at < NOW())
    PaymentTransaction.status = FAILED
    Application.status = PAYMENT_EXPIRED
    (Volunteer có thể đăng ký lại nếu còn trong hạn application_deadline)
```

### 4.4 Luồng quản lý danh mục

```
Manager CRUD EventCategory (LOCATION / TIME / TYPE)
Manager CRUD Skill
```

### 4.5 Luồng quản trị hệ thống

```
Admin CRUD User
Admin gán Role cho User
Admin khóa / mở khóa User (is_active = false/true)
```

---

## 5. Quy tắc bất biến (Immutability Rules)

| Bảng | Rule | Lý do |
| ------ | ------ | ------- |
| `events` | Không sửa core info khi `status IN ('IN_PROGRESS', 'COMPLETED')` | Tránh sai lệch dữ liệu sự kiện đang/cũ |
| `events` | Không sửa `is_paid`, `price` khi `status = PUBLISHED` | Tránh thay đổi phí sau khi Volunteer đã đăng ký |
| `applications` | `PENDING → APPROVED/REJECTED` (miễn phí) là một chiều | Audit trail |
| `applications` | `PENDING → WAITING_PAYMENT → APPROVED` (có phí) là một chiều | Audit trail |
| `applications` | `WAITING_PAYMENT → PAYMENT_EXPIRED` là một chiều | Không thể quay lại thanh toán sau khi hết hạn |
| `applications` | `PENDING/WAITING_PAYMENT/APPROVED/PAYMENT_EXPIRED → CANCELLED` chỉ do Volunteer | Volunteer tự hủy; hủy WAITING_PAYMENT → payment FAILED; hủy APPROVED → giảm approved_participants |
| `payment_transactions` | `PENDING → SUCCESS` là một chiều, bất biến sau SUCCESS | Dữ liệu tài chính không được sửa đổi |
| `payment_transactions` | `PENDING → FAILED` là một chiều | Giao dịch lỗi không thể quay lại PENDING |
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

-- Tra cứu giao dịch theo application
INDEX idx_payment_transactions_application_id ON payment_transactions(application_id);

-- Tra cứu giao dịch theo mã VNPay
INDEX idx_payment_transactions_vnp_txn_ref ON payment_transactions(vnp_txn_ref);

-- Lọc giao dịch theo status
INDEX idx_payment_transactions_status ON payment_transactions(status);
```

### 6.2 Query thường gặp

| Query | Index sử dụng | Tần suất |
| ------- | -------------- | ---------- |
| Danh sách Event PUBLISHED cho Volunteer | `idx_events_status_active`, `idx_events_category_status_active_date` | Cao |
| Đơn đăng ký của tôi (Volunteer) | `idx_applications_user_status` | Cao |
| Đơn đăng ký của Event (Staff) | `idx_applications_event_status` | Cao |
| Đăng nhập (check email) | `users.email` UNIQUE | Rất cao |
| Đối soát giao dịch VNPay | `idx_payment_transactions_vnp_txn_ref` | Trung bình |
| Xem lịch sử thanh toán của Application | `idx_payment_transactions_application_id` | Trung bình |

---

## 7. Phân quyền theo Role

| Thao tác | Volunteer | Staff | Manager | Admin |
| ----------- | :---------: | :-----: | :-------: | :-----: |
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
| Hủy đơn (PENDING/WAITING_PAYMENT/APPROVED/PAYMENT_EXPIRED → CANCELLED) | ✅ | | | |
| Xem đơn của chính mình | ✅ | | | |
| Xem đơn của Event | | ✅ | ✅ | |
| Duyệt đơn (PENDING → APPROVED/WAITING_PAYMENT) | | ✅ | | |
| Từ chối đơn | | ✅ | | |
| **Payment Transactions** | | | | |
| Tạo giao dịch (tự động khi WAITING_PAYMENT) | | (hệ thống) | | |
| Thanh toán (redirect VNPay) | ✅ | | | |
| Xem lịch sử thanh toán của chính mình | ✅ | | | |
| Xem giao dịch của Event | | ✅ | ✅ | |
| Xem tất cả giao dịch | | | | ✅ |

---

## 8. Migration Order

Thứ tự tạo bảng khi migrate:

### Phase 1: Master Data

1. `001_create_roles.sql`

### Phase 2: Core Entities

1. `002_create_users.sql`
2. `003_create_skills.sql`
3. `004_create_event_categories.sql`

### Phase 3: Auth & Session

1. `005_create_user_sessions.sql`
2. `006_create_login_attempts.sql`
3. `007_create_email_verifications.sql`

### Phase 4: User Relations

1. `008_create_user_skills.sql`

### Phase 5: Events & Applications

1. `009_create_events.sql`
2. `010_create_applications.sql`

### Phase 6: Payment

 1. `011_create_payment_transactions.sql`

---

## 9. Prisma Schema Reference

### 9.1 File schema

- File chính: `backend/prisma/schema.prisma`

### 9.2 Commands

```bash
# Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma

# Format schema
npx prisma format --schema=prisma/schema.prisma

# Validate schema
npx prisma validate --schema=prisma/schema.prisma

# Tạo migration
npx prisma migrate dev --name <migration_name> --schema=prisma/schema.prisma

# Apply migrations
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 9.3 Conventions

- **Database tables**: `snake_case` (e.g., `user_skills`, `payment_transactions`)
- **Prisma models**: `PascalCase` (e.g., `UserSkill`, `PaymentTransaction`)
- **Mapping**: `@@map("payment_transactions")`
- **Enums**: `PascalCase` value (e.g., `PENDING_APPROVAL`, `WAITING_PAYMENT`)
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
- [x] Payment transaction immutability (SUCCESS records cannot be modified)
- [x] VNPay IPN callback verification (checksum validation)
- [x] Payment amount verified against event.price before processing
- [x] Payment timeout enforced (PAYMENT_EXPIRED after deadline)

---

**End of DATABASE2.md**

**Version**: 4.0  
**Status**: Ready for Implementation  
**Last Updated**: 2026-07-27

**Tham chiếu**: `AGENTS.md`, `CLAUDE.md`, `backend/prisma/schema.prisma`, `DATABASE.md`
