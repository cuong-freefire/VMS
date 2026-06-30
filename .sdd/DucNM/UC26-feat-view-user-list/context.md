# CONTEXT.md — View User List (UC26)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Hệ thống VMS phục vụ nhiều nhóm người dùng (Volunteer, Staff, Manager, Admin) với các quyền hạn khác nhau. Admin cần có một trang danh sách người dùng tổng thể để giám sát toàn bộ tài khoản trong hệ thống, kiểm tra trạng thái hoạt động, và thực hiện các thao tác quản lý như thêm mới, chỉnh sửa, vô hiệu hóa. Nếu không có chức năng này, Admin không thể kiểm soát ai đang sử dụng hệ thống và không thể phát hiện tài khoản bất thường.

## 2. DOMAIN KNOWLEDGE

- **User (Người dùng):** Là tài khoản của tất cả các nhóm (Volunteer, Staff, Manager, Admin). Mỗi user có email duy nhất, role xác định, và trạng thái hoạt động.
- **Soft-delete:** User bị vô hiệu hóa (`is_active: false`) vẫn tồn tại trong database nhưng không thể đăng nhập hoặc thực hiện thao tác nào.
- **Phân quyền xem:** Chỉ Admin mới có quyền xem danh sách tất cả người dùng. Các role khác không có quyền truy cập.
- **Role-based filtering:** Danh sách hiển thị role của từng user (Volunteer, Staff, Manager, Admin) để Admin dễ dàng phân biệt.

## 3. STAKEHOLDERS

- **Admin:** Cần xem toàn bộ danh sách người dùng (active + inactive) để giám sát, kiểm tra và quản lý tài khoản.
- **Security/Audit:** Cần khả năng phát hiện tài khoản bất thường hoặc bị vô hiệu hóa.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền truy cập. Staff, Manager, Volunteer bị từ chối HTTP 403. Guest bị từ chối HTTP 401.
- **Soft-delete visibility:** Admin thấy cả user active lẫn inactive.
- **API format:** Endpoint bắt buộc là `GET /api/v1/users` với prefix chuẩn dự án.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ cho endpoint này.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng User đã có trong schema với các trường: `user_id`, `email`, `full_name`, `phone`, `avatar_url`, `role_id`, `is_active`, `created_at`, `updated_at`.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Giả định danh sách người dùng có thể lên đến hàng nghìn, nên phân trang là bắt buộc.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phân trang:** Danh sách người dùng có cần phân trang không? Mặc định limit là bao nhiêu?
2. **Tìm kiếm:** Có hỗ trợ tìm kiếm theo tên hoặc email không?
3. **Sắp xếp:** Có hỗ trợ sắp xếp theo ngày tạo, tên, email không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Có hỗ trợ phân trang (page, limit). Mặc định limit = 20.
- **A2:** Có hỗ trợ tìm kiếm theo tên và email (query param `search`). Tìm kiếm không phân biệt hoa/thường.
- **A3:** Có hỗ trợ sắp xếp theo `created_at` (mặc định giảm dần). Có thể mở rộng thêm trường sort sau.