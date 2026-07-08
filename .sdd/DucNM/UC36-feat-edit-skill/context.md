# CONTEXT.md — Edit Skill (UC36)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Manager cần có khả năng chỉnh sửa thông tin kỹ năng — ví dụ: đổi tên, cập nhật mô tả, hoặc vô hiệu hóa kỹ năng không còn sử dụng. Nếu không có chức năng này, Manager không thể cập nhật hoặc ngừng sử dụng các kỹ năng đã lỗi thời.

## 2. DOMAIN KNOWLEDGE

- **Editable fields:** Tên, mô tả, trạng thái active/inactive.
- **Unique constraint:** Khi đổi tên, tên mới không được trùng với skill khác.
- **Soft-delete:** Vô hiệu hóa skill (is_active = false) thay vì xóa cứng.

## 3. STAKEHOLDERS

- **Manager:** Cần cập nhật thông tin kỹ năng.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager và Admin.
- **API format:** Endpoint là `PATCH /api/v1/skills/:id`.
- **Validation:** Validate bằng Zod.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Skill đã có trong schema.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Edit ảnh hưởng:** Khi vô hiệu hóa skill, các volunteer đã gán skill đó có bị ảnh hưởng không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không. Dữ liệu lịch sử được giữ nguyên. Chỉ không cho chọn skill inactive cho lần cập nhật profile tiếp theo.