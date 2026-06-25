# share_context.md — VMS Multi-Agent Backbone

File này là **NGUỒN SỰ THẬT CHUNG** cho mọi AI agents (FE & BE) trong dự án VMS.

**Trọng tài/Người cập nhật**: Lead Agent hoặc Developer sau mỗi quyết định quan trọng.

## 1. Trạng thái đội ngũ

**LAST UPDATED:** 2026-06-25 12:27  
**Updated by:** Lead Agent (Task: Restructure Project Documentation)

| Member | Module | Status | Current Task | Estimated Completion |
|--------|--------|--------|--------------|---------------------|
| **Member 1** | Auth & Profile | ⏳ READY TO START | Setup authentication flow | - |
| **Member 2** | Volunteer Event | 🔄 IN PROGRESS | Implement event listing & apply event | 2026-06-26 |
| **Member 3** | Staff Operations | ⏳ READY TO START | Waiting for Event Module APIs | - |
| **Member 4** | Manager Tools | ⏳ READY TO START | Waiting for User Management spec | - |
| **Member 5** | Admin & Reports | ⏳ READY TO START | Waiting for core modules | - |

**Legend:**
- ✅ COMPLETED — Module hoàn thành và deployed
- 🔄 IN PROGRESS — Đang code
- ⏳ READY TO START — Chưa bắt đầu
- ⚠️ BLOCKED — Bị block bởi dependency khác

## 2. API Contracts (Giao kèo API)

Định nghĩa chuẩn các endpoint. FE Agent nhìn vào đây để làm UI, BE Agent nhìn vào đây để viết logic.

### Authentication Module (Member 1)

#### POST /api/v1/auth/register
- **Mô tả:** Đăng ký tài khoản mới (Volunteer role mặc định)
- **Request:** `{ email: string, password: string, full_name: string }`
- **Response 201:** `{ success: true, message: "Registration successful" }`
- **Response 409:** `{ success: false, error: "Email already exists" }`
- **Status:** ⏳ PENDING

#### POST /api/v1/auth/login
- **Mô tả:** Đăng nhập và nhận JWT cookie
- **Request:** `{ email: string, password: string }`
- **Response 200:** `{ success: true, user: { id, email, role } }`
- **Response 401:** `{ success: false, error: "Invalid credentials" }`
- **Status:** ⏳ PENDING

#### POST /api/v1/auth/logout
- **Mô tả:** Đăng xuất và clear JWT cookie
- **Response 200:** `{ success: true, message: "Logged out successfully" }`
- **Status:** ⏳ PENDING

---

### Event Module (Member 2)

#### GET /api/v1/events
- **Mô tả:** Lấy danh sách sự kiện (public, filter, pagination)
- **Query:** `?status=Approved&page=1&limit=10&search=volunteer`
- **Response 200:** `{ success: true, data: { events: Event[], total: number, page, limit } }`
- **Status:** 🔄 IN PROGRESS (Dự kiến xong: 2026-06-26)

#### GET /api/v1/events/:id
- **Mô tả:** Xem chi tiết sự kiện
- **Response 200:** `{ success: true, data: Event }`
- **Response 404:** `{ success: false, error: "Event not found" }`
- **Status:** 🔄 IN PROGRESS

#### POST /api/v1/applications
- **Mô tả:** Volunteer đăng ký tham gia sự kiện
- **Auth:** Required (JWT)
- **Request:** `{ event_id: number, motivation: string? }`
- **Response 201:** `{ success: true, data: { application_id: number } }`
- **Response 409:** `{ success: false, error: "Already applied" }`
- **Response 400:** `{ success: false, error: "Event is full" }`
- **Status:** 🔄 IN PROGRESS

#### GET /api/v1/applications/me
- **Mô tả:** Xem danh sách đơn đăng ký của user hiện tại
- **Auth:** Required (JWT)
- **Response 200:** `{ success: true, data: Application[] }`
- **Status:** ⏳ PENDING

---

### Staff Module (Member 3)

#### GET /api/v1/staff/applications/event/:eventId
- **Mô tả:** Staff xem danh sách đơn đăng ký của sự kiện
- **Auth:** Required (Staff/Manager/Admin)
- **Response 200:** `{ success: true, data: Application[] }`
- **Status:** ⏳ PENDING (Blocked by Event Module)

#### PATCH /api/v1/staff/applications/:id/approve
- **Mô tả:** Duyệt đơn đăng ký
- **Auth:** Required (Staff/Manager/Admin)
- **Request:** `{ approved_by: number (auto from JWT) }`
- **Response 200:** `{ success: true, message: "Application approved" }`
- **Response 400:** `{ success: false, error: "Event is full" }`
- **Status:** ⏳ PENDING

#### PATCH /api/v1/staff/applications/:id/reject
- **Mô tả:** Từ chối đơn đăng ký
- **Auth:** Required (Staff/Manager/Admin)
- **Request:** `{ reason: string? }`
- **Response 200:** `{ success: true, message: "Application rejected" }`
- **Status:** ⏳ PENDING

#### POST /api/v1/staff/attendance/check
- **Mô tả:** Điểm danh tình nguyện viên
- **Auth:** Required (Staff/Manager/Admin)
- **Request:** `{ application_id: number, status: "Present" | "Absent" }`
- **Response 201:** `{ success: true, data: { attendance_id: number } }`
- **Response 400:** `{ success: false, error: "Application not approved" }`
- **Status:** ⏳ PENDING

---

### Manager Module (Member 4)

#### GET /api/v1/manager/users
- **Mô tả:** Manager xem danh sách users (filter by role, status)
- **Auth:** Required (Manager/Admin)
- **Query:** `?role=Volunteer&is_active=true&page=1&limit=20`
- **Response 200:** `{ success: true, data: { users: User[], total, page, limit } }`
- **Status:** ⏳ PENDING

#### PATCH /api/v1/manager/users/:id/deactivate
- **Mô tả:** Deactivate user (soft delete)
- **Auth:** Required (Manager/Admin)
- **Response 200:** `{ success: true, message: "User deactivated" }`
- **Status:** ⏳ PENDING

---

### Admin Module (Member 5)

#### GET /api/v1/admin/dashboard
- **Mô tả:** Admin dashboard statistics
- **Auth:** Required (Admin)
- **Response 200:** `{ success: true, data: { total_events, total_volunteers, total_donations, ... } }`
- **Status:** ⏳ PENDING

#### POST /api/v1/certificates/generate
- **Mô tả:** Generate certificate cho volunteer
- **Auth:** Required (Staff/Manager/Admin)
- **Request:** `{ application_id: number }`
- **Response 201:** `{ success: true, data: { certificate_url: string } }`
- **Response 400:** `{ success: false, error: "Attendance not found" }`
- **Status:** ⏳ PENDING

---

## 3. Data Types (Kiểu dữ liệu dùng chung)

Cấu trúc chuẩn để tránh tình trạng Frontend dùng camelCase, Backend dùng snake_case. **Bám sát Prisma schema**.

### Event Object
```javascript
{
  event_id: number,
  title: string,
  description: string,
  max_capacity: number,
  approved_participants: number,  // Calculated field
  start_date: ISO8601,
  end_date: ISO8601,
  location: string,
  status: "Pending" | "Approved" | "In Progress" | "Completed" | "Cancelled",
  organization_id: number,
  created_by: number,
  is_active: boolean,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

### Application Object
```javascript
{
  application_id: number,
  user_id: number,
  event_id: number,
  status: "Pending" | "Approved" | "Rejected" | "Cancelled",
  motivation: string | null,
  applied_at: ISO8601,
  approved_at: ISO8601 | null,
  approved_by: number | null
}
```

### User Object
```javascript
{
  user_id: number,
  email: string,
  full_name: string,
  role: "Guest" | "Volunteer" | "Staff" | "Manager" | "Admin",
  is_active: boolean,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

### Attendance Object
```javascript
{
  attendance_id: number,
  application_id: number,
  status: "Present" | "Absent",
  checked_at: ISO8601,
  checked_by: number
}
```

---

## 4. KNOWN BREAKING CHANGES (Các thay đổi gây ảnh hưởng)

Ghi log mọi thay đổi có thể làm hỏng code của module khác.

### [2026-06-25 12:00] — Schema: Đổi tên `limit_capacity` → `max_capacity`
- **Impact:** FE Agent của Member 2 cần update lại hàm map dữ liệu hiển thị.
- **Action Required:** Update tất cả references trong Frontend code.
- **Status:** ⚠️ FE CHƯA UPDATE.

### [2026-06-25 12:15] — API Response Format Standardization
- **Change:** Tất cả API response phải dùng format `{ success: boolean, data?: any, error?: string }`
- **Impact:** Tất cả modules phải update response handlers.
- **Action Required:** Refactor existing endpoints để match format mới.
- **Status:** 🔄 IN PROGRESS.

---

## 5. SHARED DEPENDENCIES (Thư viện dùng chung)

Đảm bảo tính nhất quán về xử lý dữ liệu giữa FE và BE.

### Date/Time Handling
- **Backend:** Dùng `date-fns` để format ISO8601
- **Frontend:** Dùng `date-fns` để parse và hiển thị
- **Format Standard:** ISO8601 (`2026-06-25T12:00:00.000Z`)

### Authentication
- **Backend:** JWT (RS256) trong HttpOnly Cookie
- **Frontend:** Axios config `credentials: 'include'`, dùng `jwt-decode` để đọc `user_id` và `role` (optional, chỉ cho UI logic)

### Validation
- **Backend:** Zod schemas trong `/backend/src/validators/`
- **Frontend:** React Hook Form với validation rules

### HTTP Client
- **Frontend:** Axios với base URL từ `REACT_APP_API_BASE_URL`
- **Config:** `{ baseURL, withCredentials: true, timeout: 10000 }`

---

## 6. ENVIRONMENT (Môi trường phát triển)

### Local Development
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api/v1`
- **Database:** MySQL @ `localhost:3306` (DB name: `vms`)

### Testing Environment
- **Backend Test DB:** `vms_test`
- **Run Tests:** `npm test` (Jest + Supertest)

---

## 7. COMMUNICATION PROTOCOLS

### Cross-Module Collaboration
1. **API Contract Changes:** PHẢI update file này TRƯỚC KHI implement
2. **Breaking Changes:** Notify trong Slack channel + update Breaking Changes section
3. **Blocked Dependencies:** Update Status table và tag người phụ trách

### Code Review Process
1. Create PR với title format: `[Module] Feature description`
2. Tag owner của affected modules
3. Wait for approval (min 1 reviewer)
4. Merge sau khi tests pass

---

**Version**: 2.0  
**Last Updated**: 2026-06-25  
**Changelog**:
- v2.0: Tái cấu trúc theo bộ khung mới - tập trung vào API Contracts, Data Types và Team Status
- v2.0: Thêm API contracts chi tiết cho 5 modules
- v2.0: Chuẩn hóa Data Types theo Prisma schema

*Tham chiếu: Xem quy trình SDD tại `CONSTITUTION.md`, Tech Stack tại `AGENTS.md`, Architecture tại `CLAUDE.md`.*
