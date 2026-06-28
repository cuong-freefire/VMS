# CONTEXT.md — Volunteer Statistics (UC56)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Admin và Manager cần thống kê về tình nguyện viên: số lượng đăng ký mới theo tháng, tổng số tình nguyện viên đang hoạt động, tỷ lệ tham gia sự kiện (participation rate), và top tình nguyện viên tích cực nhất. Dữ liệu này giúp đánh giá mức độ thu hút và gắn kết của tình nguyện viên với hệ thống.

## 2. DOMAIN KNOWLEDGE

- **Volunteer Statistics:** Dữ liệu aggregate từ bảng User (với role = VOLUNTEER) và Application.
- **Các chỉ số:**
  - `new_volunteers_by_month`: Số lượng volunteer mới đăng ký theo từng tháng.
  - `total_active_volunteers`: Tổng số volunteer có `is_active: true`.
  - `participation_rate`: Tỷ lệ volunteer đã tham gia ít nhất 1 sự kiện / tổng volunteer.
  - `top_5_volunteers_by_events`: Top 5 volunteer tham gia nhiều sự kiện nhất (dựa trên application approved + attendance).
- **Read-only:** Chỉ GET.
- **Phân quyền:** Admin toàn hệ thống, Manager trong phạm vi tổ chức.

## 3. STAKEHOLDERS

- **Admin:** Cần thống kê volunteer để đánh giá sức khỏe hệ thống.
- **Manager:** Cần thống kê volunteer trong tổ chức mình.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Read-only:** Endpoint `GET /api/v1/dashboard/volunteer-stats`.
- **Performance:** Dùng aggregation, tránh N+1 queries.
- **Cache:** TTL 5 phút.
- **Phân quyền:** Chỉ Admin và Manager.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng User có role và is_active để xác định volunteer active.
- Giả định Application lưu event_id của sự kiện volunteer tham gia.
- Giả định Manager chỉ thấy volunteer đã tham gia sự kiện thuộc tổ chức mình.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Participation rate:** Tính dựa trên application approved hay attendance check-in?
2. **Top volunteer:** Xếp hạng dựa trên số sự kiện đã tham gia (có điểm danh) hay số lần đăng ký?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Participation rate = số volunteer có ít nhất 1 attendance check-in / tổng số volunteer active.
- **A2:** Top volunteer dựa trên số sự kiện đã điểm danh thành công (có attendance record).
