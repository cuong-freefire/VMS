# Research: Edit User (UC29)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. PATCH vs PUT cho Edit User

- **Decision**: Dùng HTTP `PATCH` method thay vì `PUT`.
- **Rationale**:
  - PATCH cho phép cập nhật một phần (partial update) — client chỉ gửi fields cần thay đổi.
  - PUT yêu cầu gửi toàn bộ resource — không phù hợp vì email không thể thay đổi.
  - RESTful convention: PATCH cho partial updates.
- **Pattern**: `PATCH /api/v1/users/:id` với body chỉ chứa fields cần update.

## 2. Zod Schema cho Partial Update

- **Decision**: Dùng `z.object()` với tất cả fields optional, kết hợp `.refine()` kiểm tra body không rỗng.
- **Rationale**:
  - PATCH là partial update — không field nào là bắt buộc.
  - Cần check: ít nhất 1 field phải được gửi lên (không cho phép body rỗng).
- **Pattern**:
  ```js
  export const updateUserSchema = z.object({
    full_name: z.string().min(1, 'Full name cannot be empty').optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url('Invalid URL').optional().nullable(),
    role_id: z.number().int().positive('Role is required').optional(),
    is_active: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update.'
  });
  ```

## 3. Self-Role-Downgrade Protection

- **Decision**: Trong service, kiểm tra nếu `req.user.user_id === targetUserId` và request có `role_id` thấp hơn role hiện tại → throw 403.
- **Rationale**:
  - Spec yêu cầu: Admin không thể tự hạ role của chính mình.
  - Cần so sánh current role của target user với `role_id` mới.
  - So sánh bằng `role_id` (integer): role_id càng lớn thường quyền càng cao (ADMIN=4, MANAGER=3, STAFF=2, VOLUNTEER=1).
- **Pattern**:
  ```js
  if (isSelfUpdate && role_id && role_id < currentUserRole.role_id) {
    throw new ServiceError('Cannot downgrade your own role.', 403, 'SELF_ROLE_DOWNGRADE');
  }
  ```

## 4. Email Immutability

- **Decision**: `updateUserSchema` KHÔNG bao gồm field `email` — loại bỏ hoàn toàn khỏi Zod schema.
- **Rationale**:
  - Spec yêu cầu: Email là bất biến, không thể thay đổi.
  - Cách đơn giản nhất: không cho phép field `email` trong request body ngay từ validation layer.
- **Implementation**: Chỉ cần không include `email` trong `updateUserSchema`.

## 5. Soft Delete via is_active

- **Decision**: Admin set `is_active = false` để vô hiệu hóa tài khoản. Đây là soft delete.
- **Rationale**:
  - Soft delete là bắt buộc theo ADR-005 cho master data (User, Event, Organization).
  - User bị vô hiệu hóa (`is_active = false`) không thể đăng nhập.
  - Admin có thể reactivate bằng set `is_active = true`.
- **Không cần hard delete** — không có chức năng xóa cứng trong scope.

## 6. Frontend: Edit Form kế thừa từ Add Form

- **Decision**: `EditUserPage.jsx` kế thừa layout từ `AddUserPage.jsx` (UC28), pre-fill form với dữ liệu user hiện tại.
- **Rationale**:
  - Add và Edit form có cấu trúc giống nhau (fields: full_name, phone, role, is_active).
  - Khác biệt: Edit cần fetch user detail trước, pre-fill form, không cho sửa email.
  - Submit dùng `PATCH` thay vì `POST`.
- **Pattern**: Fetch user by ID → populate form → allow edit → PATCH on submit.

## 7. Audit Log cho Thay đổi Quan trọng

- **Decision**: Ghi log cho các thay đổi role và is_active (async, không block main flow).
- **Rationale**:
  - Lesson 4 từ CLAUDE.md: Audit log phải được log bất đồng bộ.
  - Role change và account activation/deactivation là thay đổi quan trọng cần audit trail.
- **Pattern**: Sử dụng Pino logger để log sau khi transaction commit.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| HTTP Method | PATCH (partial update) | RESTful convention cho partial updates |
| Zod schema | All fields optional + refine body not empty | PATCH không yêu cầu field bắt buộc |
| Self-role check | Compare role_id trong service | Spec FR-004 |
| Email immutability | Loại bỏ khỏi Zod schema | Spec FR-003 — cách đơn giản nhất |
| Soft delete | is_active = false | ADR-005 compliance |
| Frontend | Kế thừa AddUserPage, pre-fill data | Code reuse |
| Audit log | Pino logger async cho role/is_active changes | Lesson 4 từ CLAUDE.md |