# CONTEXT.md — View User Detail (UC27)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi Admin duyệt danh sách người dùng, có những trường hợp cần xem thông tin chi tiết của một người dùng cụ thể — ví dụ: kiểm tra lịch sử hoạt động, xem đầy đủ thông tin liên hệ, hoặc xác minh thông tin trước khi thực hiện chỉnh sửa. Nếu không có chức năng xem chi tiết, Admin phải đoán hoặc tìm kiếm thông tin qua nhiều màn hình khác nhau, gây mất thời gian.

## 2. DOMAIN KNOWLEDGE

- **User Detail:** Thông tin chi tiết của một người dùng bao gồm: họ tên, email, số điện thoại, avatar, role, trạng thái active/inactive, ngày tạo, ngày cập nhật.
- **Phân quyền:** Chỉ Admin mới có quyền xem chi tiết bất kỳ user nào. Manager và Staff không có quyền.
- **View history:** Trang chi tiết cũng có thể hiển thị tổng quan nhanh về các hoạt động gần đây (số sự kiện đã tham gia, số feedback đã gửi) nhưng không đi sâu — phần đó thuộc UC21 (View Volunteer History).

## 3. STAKEHOLDERS

- **Admin:** Cần xem chi tiết thông tin người dùng để kiểm tra, xác minh và ra quyết định quản lý.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền truy cập. Các role khác bị từ chối HTTP 403.
- **API format:** Endpoint bắt buộc là `GET /api/v1/users/:id`.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ cho endpoint này.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng User đã có trong schema với đầy đủ trường.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Giả định route param `:id` là user_id hợp lệ.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **404 handling:** Nếu user_id không tồn tại trong database, hệ thống trả về HTTP 404 hay 400?
2. **Thông tin bổ sung:** Trang chi tiết có cần hiển thị thống kê nhanh (số sự kiện đã tham gia, số feedback) không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Trả về HTTP 404 Not Found với message "User not found."
- **A2:** Ở v1, chỉ hiển thị thông tin user cơ bản. Thống kê nhanh sẽ được bổ sung sau nếu cần.