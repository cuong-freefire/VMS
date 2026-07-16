# CONTEXT.md — Edit Category (UC33)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Manager cần có khả năng chỉnh sửa thông tin danh mục — ví dụ: đổi tên, cập nhật mô tả, hoặc vô hiệu hóa danh mục không còn sử dụng. Nếu không có chức năng này, Manager không thể cập nhật hoặc ngừng sử dụng các danh mục đã lỗi thời.

## 2. DOMAIN KNOWLEDGE

- **Editable fields:** Tên, mô tả, type, trạng thái active/inactive.
- **Unique constraint:** Khi đổi tên, tên mới không được trùng với category khác trong cùng type.
- **Soft-delete:** Vô hiệu hóa category (is_active = false) thay vì xóa cứng.

## 3. STAKEHOLDERS

- **Manager:** Cần cập nhật thông tin danh mục.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager và Admin mới có quyền.
- **API format:** Endpoint là `PATCH /api/v1/categories/:id`.
- **Validation:** Validate bằng Zod.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Category đã có trong schema.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Edit type:** Có cho phép đổi type của category không?
2. **Edit ảnh hưởng:** Khi vô hiệu hóa category, các sự kiện đang dùng category đó có bị ảnh hưởng không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không cho phép đổi type. Nếu cần type khác, tạo category mới.
- **A2:** Không. Các sự kiện đã được gán category vẫn giữ nguyên dữ liệu. Chỉ không cho chọn category inactive cho sự kiện mới.