# CONTEXT.md — Add Category (UC32)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Manager cần có khả năng thêm mới danh mục (Category) để phân loại sự kiện — ví dụ: thêm loại hình sự kiện mới như "Thể thao" hoặc địa điểm tổ chức mới. Nếu không có chức năng này, Manager không thể mở rộng hệ thống danh mục khi có nhu cầu phân loại mới.

## 2. DOMAIN KNOWLEDGE

- **Category creation:** Manager tạo category với tên, mô tả, type (location, event_type, time_frame).
- **Unique name:** Tên category phải là duy nhất trong cùng một type.
- **Phân quyền:** Chỉ Manager mới có quyền thêm category. Admin cũng có thể thêm.

## 3. STAKEHOLDERS

- **Manager:** Cần thêm danh mục mới để phân loại sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager và Admin mới có quyền.
- **API format:** Endpoint bắt buộc là `POST /api/v1/categories`.
- **Validation:** Validate bằng Zod.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Category đã có trong schema.
- Giả định type là enum hoặc string với các giá trị xác định.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Type validation:** Có cần validate type phải thuộc danh sách cho phép không?
2. **Unique constraint:** Tên category có unique không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Có. Type phải thuộc các giá trị: "location", "event_type", "time_frame".
- **A2:** Có. Tên category unique trong cùng một type.