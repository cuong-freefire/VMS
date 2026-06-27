<!-- Bản nháp -->
# shared_context.md — VMS Multi-Agent Backbone

# File này là NGUỒN SỰ THẬT CHUNG cho mọi AI agents (FE & BE) trong dự án VMS

# Trọng tài/Người cập nhật: Lead Agent hoặc Developer sau mỗi quyết định quan trọng

## 1. METADATA & TRẠNG THÁI TIẾN ĐỘ

- **LAST UPDATED:** 2026-06-24 15:30
- **Updated by:** Lead Agent (Task: Setup VMS Context)
- **Agent Status:**
  - FE Agent (Member 1 - Auth/Profile): ⏳ READY TO START
  - BE Agent (Member 2 - Event Module): 🔄 IN PROGRESS
  - BE Agent (Member 3 - Staff/Application): ⏳ READY TO START

---

## 2. API CONTRACTS (Giao kèo API)
> Định nghĩa chuẩn các endpoint. FE Agent nhìn vào đây để làm UI, BE Agent nhìn vào đây để viết logic.

**POST /api/v1/events**

- **Mô tả:** Staff tạo sự kiện mới.
- **Request:** `{ title: string, max_capacity: number, start_date: ISO8601 }`
- **Response 201:** `{ success: true, event_id: number }`
- **Status:** ✅ IMPLEMENTED (Backend Agent đã xong, FE có thể gọi)

**GET /api/v1/applications/event/:eventId**

- **Mô tả:** Lấy danh sách đơn đăng ký của một sự kiện.
- **Response 200:** `{ success: true, applications: Application[] }`
- **Status:** 🔄 IN PROGRESS (Backend Agent đang code, dự kiến xong trong 2h)

**POST /api/v1/attendance/check**

- **Mô tả:** Staff điểm danh tình nguyện viên.
- **Request:** `{ application_id: number, status: "Present" | "Absent" }`
- **Status:** ⏳ PENDING (Chưa bắt đầu)

---

## 3. DATA TYPES (Kiểu dữ liệu dùng chung)

> Cấu trúc chuẩn để tránh tình trạng Frontend dùng camelCase, Backend dùng snake_case. Bám sát Prisma schema.

**Event Object:**

- `event_id`: number (TUYỆT ĐỐI KHÔNG dùng eventId)
- `title`: string
- `max_capacity`: number
- `status`: enum ["Pending", "Approved", "In Progress", "Completed", "Cancelled"]

**Application Object:**

- `application_id`: number
- `user_id`: number
- `event_id`: number
- `status`: enum ["Pending", "Approved", "Rejected", "Cancelled"]
- `applied_at`: ISO8601 string

---

## 4. KNOWN BREAKING CHANGES (Các thay đổi gây ảnh hưởng)
>
> Ghi log mọi thay đổi có thể làm hỏng code của module khác.

- **[2026-06-24 10:00]:** Đổi tên trường `limit_capacity` thành `max_capacity` trong bảng Event.
  - *Impact:* FE Agent của Member 2 cần update lại hàm map dữ liệu hiển thị.
  - *Status:* ⚠️ FE CHƯA UPDATE.

---

## 5. SHARED DEPENDENCIES (Thư viện dùng chung)
>
> Đảm bảo tính nhất quán về xử lý dữ liệu giữa FE và BE.

- **Xử lý ngày tháng:** Backend dùng `date-fns` để format ISO8601 ↔ Frontend cũng phải dùng `date-fns` để parse hiển thị.
- **Xác thực:** Backend trả JWT (RS256) ↔ Frontend dùng `jwt-decode` để đọc `user_id` và `role`.
- **Validation:** Cả FE và BE đều BẮT BUỘC dùng chung schema validate của `zod`.

---

## 6. ENVIRONMENT (Môi trường phát triển)

- **Frontend Local:** `http://localhost:3000`
- **Backend API Local:** `http://localhost:5000/api/v1`
