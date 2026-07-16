# CONTEXT.md — Search Category

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi danh sách danh mục trong hệ thống VMS trở nên lớn, Manager cần có khả năng tìm kiếm nhanh danh mục theo tên hoặc mô tả. Nếu không có chức năng tìm kiếm, Manager phải cuộn thủ công qua nhiều trang để tìm đúng danh mục, gây mất thời gian và hiệu quả thấp.

## 2. DOMAIN KNOWLEDGE

- **Search scope:** Tìm kiếm theo tên (name) và mô tả (description) của danh mục.
- **Case-insensitive:** Tìm kiếm không phân biệt chữ hoa/chữ thường.
- **Partial match:** Tìm kiếm theo từ khóa một phần (ví dụ: "Học" sẽ tìm được "Học Tập", "Học thuật").
- **Kết hợp với filter:** Search hoạt động độc lập hoặc kết hợp với filter type (location, event_type, time_frame).
- **Phân quyền:** Manager có quyền search trên tất cả category (active + inactive). Staff/Volunteer/Guest chỉ search được trên category active (phục vụ UC11 Filter Event).

## 3. STAKEHOLDERS

- **Manager:** Cần tìm kiếm nhanh danh mục để quản lý.
- **Staff, Volunteer, Guest:** Cần tìm kiếm category active để tham chiếu khi lọc sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền theo role:** Manager thấy tất cả; Staff/Volunteer/Guest chỉ thấy active.
- **API format:** Endpoint là `GET /api/v1/categories?search=keyword` — gộp chung với UC31.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định search được implement dưới dạng query param `search` trên endpoint GET /api/v1/categories.
- Giả định search sử dụng SQL LIKE, không cần FULLTEXT index ở v1 do số lượng category ít.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Search độc lập:** Search Category có nên là endpoint riêng không?
2. **Search field:** Chỉ search theo name, hay thêm description và type?
3. **Guest access:** Guest có cần search category không (phục vụ UC11)?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Search là một phần của UC31 (GET /api/v1/categories) thông qua query param `search`. Không cần endpoint riêng.
- **A2:** Search theo name và description. Type là filter riêng, không phải search field.
- **A3:** Guest không cần search category riêng — Guest chỉ thấy category active qua endpoint public.