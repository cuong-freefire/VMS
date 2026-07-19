# CONTEXT.md — Search User

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi danh sách người dùng trong hệ thống VMS trở nên lớn, Admin cần có khả năng tìm kiếm nhanh người dùng theo tên hoặc email. Nếu không có chức năng tìm kiếm, Admin phải cuộn thủ công qua nhiều trang để tìm đúng người dùng, gây mất thời gian và hiệu quả thấp.

## 2. DOMAIN KNOWLEDGE

- **Search scope:** Tìm kiếm theo tên (full_name) và email của người dùng.
- **Case-insensitive:** Tìm kiếm không phân biệt chữ hoa/chữ thường.
- **Partial match:** Tìm kiếm theo từ khóa một phần (ví dụ: "Nguyen" sẽ tìm được "Nguyen Van A", "Thi Nguyen").
- **Kết hợp với filter:** Search hoạt động độc lập hoặc kết hợp với filter (role, is_active, date range).
- **Phân quyền:** Chỉ Admin mới có quyền sử dụng search.

## 3. STAKEHOLDERS

- **Admin:** Cần tìm kiếm nhanh người dùng để quản lý.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền.
- **API format:** Endpoint là `GET /api/v1/users?search=keyword` — gộp chung với UC26.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định search được implement dưới dạng query param `search` trên endpoint GET /api/v1/users.
- Giả định search sử dụng SQL LIKE hoặc FULLTEXT index tùy theo khối lượng dữ liệu.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Search độc lập:** Search User có nên là endpoint riêng không?
2. **Search field:** Chỉ search theo tên và email, hay thêm số điện thoại?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Search là một phần của UC26 (GET /api/v1/users) thông qua query param `search`. Không cần endpoint riêng.
- **A2:** Chỉ search theo full_name và email. Số điện thoại không nằm trong search scope ở v1.