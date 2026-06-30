# CONTEXT.md — Add Skill (UC35)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Manager cần có khả năng thêm mới kỹ năng (Skill) vào hệ thống — ví dụ: thêm kỹ năng "Photography" khi có nhu cầu mới. Nếu không có chức năng này, Manager không thể mở rộng danh sách kỹ năng.

## 2. DOMAIN KNOWLEDGE

- **Skill creation:** Manager tạo skill với tên và mô tả.
- **Unique name:** Tên skill phải là duy nhất.
- **Phân quyền:** Chỉ Manager và Admin mới có quyền thêm skill.

## 3. STAKEHOLDERS

- **Manager:** Cần thêm kỹ năng mới.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager và Admin.
- **API format:** Endpoint là `POST /api/v1/skills`.
- **Validation:** Validate bằng Zod.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Skill đã có trong schema.
- Giả định tên skill unique trên toàn bảng (không phân loại).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Unique constraint:** Tên skill có unique không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Có. Tên skill là duy nhất trên toàn hệ thống.