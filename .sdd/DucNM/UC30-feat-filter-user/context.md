# CONTEXT.md — Filter User (UC30)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi danh sách người dùng trong hệ thống VMS trở nên lớn (hàng trăm hoặc hàng nghìn tài khoản), Admin cần có khả năng lọc danh sách theo nhiều tiêu chí khác nhau — ví dụ: lọc theo role, theo trạng thái active/inactive, hoặc theo ngày tạo. Nếu không có chức năng lọc, Admin phải cuộn qua nhiều trang để tìm đúng người dùng mình cần.

## 2. DOMAIN KNOWLEDGE

- **Filter criteria:** Các tiêu chí lọc bao gồm: role (Volunteer, Staff, Manager, Admin), trạng thái (active/inactive), khoảng thời gian tạo (from_date, to_date).
- **Kết hợp với search:** Filter hoạt động độc lập hoặc kết hợp với search (tìm kiếm theo tên/email).
- **Phân quyền:** Chỉ Admin mới có quyền sử dụng filter.

## 3. STAKEHOLDERS

- **Admin:** Cần lọc danh sách người dùng để nhanh chóng tìm đúng đối tượng cần quản lý.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền truy cập.
- **API format:** Endpoint là `GET /api/v1/users` với query params filter.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định filter được implement dưới dạng query params trên cùng endpoint với View User List (UC26).
- Giả định các filter có thể kết hợp với nhau (AND logic).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Filter độc lập:** Filter User có nên là một endpoint riêng hay gộp vào UC26?
2. **Filter theo ngày:** Có cần filter theo khoảng thời gian tạo không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Filter là một phần của UC26 (GET /api/v1/users) thông qua query params. Không cần endpoint riêng.
- **A2:** Có hỗ trợ filter theo khoảng thời gian tạo qua query params `from_date` và `to_date`.