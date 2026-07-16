# CONTEXT.md — Search Organization

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi danh sách tổ chức trong hệ thống VMS trở nên lớn, Admin và Manager cần có khả năng tìm kiếm nhanh tổ chức theo tên. Nếu không có chức năng tìm kiếm, Admin và Manager phải cuộn thủ công qua nhiều trang để tìm đúng tổ chức, gây mất thời gian và hiệu quả thấp.

## 2. DOMAIN KNOWLEDGE

- **Search scope:** Tìm kiếm theo tên (name) của tổ chức.
- **Case-insensitive:** Tìm kiếm không phân biệt chữ hoa/chữ thường.
- **Partial match:** Tìm kiếm theo từ khóa một phần (ví dụ: "Nhân" sẽ tìm được "Nhân Ái", "Nhân Đạo").
- **Kết hợp với filter:** Search hoạt động độc lập hoặc kết hợp với filter (is_active).
- **Phân quyền:** Admin có quyền search trên tất cả tổ chức (active + inactive). Manager/Staff chỉ search được trên tổ chức active.

## 3. STAKEHOLDERS

- **Admin:** Cần tìm kiếm nhanh tổ chức để quản lý và giám sát.
- **Manager, Staff:** Cần tìm kiếm tổ chức active để tham chiếu khi tạo sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền theo role:** Admin thấy tất cả; Manager/Staff chỉ thấy active.
- **API format:** Endpoint là `GET /api/v1/organizations?search=keyword` — gộp chung với UC37.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định search được implement dưới dạng query param `search` trên endpoint GET /api/v1/organizations.
- Giả định search sử dụng SQL LIKE, không cần FULLTEXT index ở v1 do số lượng tổ chức ít.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Search độc lập:** Search Organization có nên là endpoint riêng không?
2. **Search field:** Chỉ search theo name, hay thêm email và địa chỉ?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Search là một phần của UC37 (GET /api/v1/organizations) thông qua query param `search`. Không cần endpoint riêng.
- **A2:** Chỉ search theo name. Email và địa chỉ không nằm trong search scope ở v1.