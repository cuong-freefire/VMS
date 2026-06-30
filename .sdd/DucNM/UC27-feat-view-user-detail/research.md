# Research: View User Detail (UC27)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Get User by ID with Prisma (Backend)

- **Decision**: Sử dụng `prisma.user.findUnique({ where: { user_id: id } })` với `include: { role: true }`.
- **Rationale**:
  - `findUnique` là optimized query cho primary key lookups — nhanh hơn `findFirst`.
  - `include` để join bảng Role lấy tên role.
  - Không filter `is_active` — Admin cần thấy cả inactive users theo spec.
- **Pattern**:
  ```js
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { role: { select: { name: true } } }
  });
  ```

## 2. 404 Handling khi User ID không tồn tại

- **Decision**: Service trả về `null` từ repository → Service throw `ServiceError` với status 404.
- **Rationale**:
  - Phân tách rõ ràng: Repository chỉ query, Service quyết định business logic (404 hay không).
  - Dùng `ServiceError` pattern có sẵn từ `response.util.js`.
- **Pattern**:
  ```js
  const user = await findUserById(userId);
  if (!user) {
    throw new ServiceError('User not found.', 404, 'USER_NOT_FOUND');
  }
  ```

## 3. Validation cho Route Param `:id`

- **Decision**: Dùng `z.coerce.number().int().positive()` để validate userId là số nguyên dương.
- **Rationale**:
  - Spec context.md assumes `user_id` là integer (số nguyên auto-increment).
  - Nếu không phải số hợp lệ → throw 400 Bad Request trước khi vào service.
- **Pattern**:
  ```js
  const userIdSchema = z.coerce.number().int().positive('User ID must be a positive integer');
  ```

## 4. Inheritance từ UC26 Infrastructure

- **Decision**: Các file đã có từ UC26 (authorize middleware, user.repository base) sẽ được mở rộng thêm function `findUserById`.
- **Rationale**:
  - Tránh duplicate code — chỉ thêm 1 function mới vào repository đã có.
  - Controller/Service pattern giống UC26 nên code nhất quán.
- **Note**: `authorize.middleware.js` không cần thay đổi — đã hỗ trợ `authorize('ADMIN')`.

## 5. Frontend: User Detail Page từ User List

- **Decision**: UserDetailPage hiển thị thông tin user trong MUI Card/Paper layout.
- **Rationale**:
  - MUI Card phù hợp cho detail view — hiển thị avatar, thông tin theo sections.
  - Click vào user ở User List (UC26) → navigate đến `/users/:id` (UserDetailPage).
- **Pattern**:
  - State: `user`, `loading`, `error`
  - fetch on mount: `useEffect(() => { fetchUser(id) }, [id])`
  - Hiển thị 404 nếu user không tồn tại

## 6. API Response Format (Existing Standard)

- **Decision**: Tuân thủ chuẩn ADR-006 dùng `response.util.js`.
- **Success pattern**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin người dùng thành công",
    "data": {
      "user_id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "nguyenvana@example.com",
      "phone": "0123456789",
      "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
      "role": "VOLUNTEER",
      "is_active": true,
      "created_at": "2026-01-15T08:30:00.000Z",
      "updated_at": "2026-06-28T10:00:00.000Z"
    }
  }
  ```

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Get user by ID | Prisma `findUnique` with `include role` | Optimized PK lookup |
| 404 handling | Repository return null → Service throw ServiceError | Separation of concerns |
| ID validation | Zod `coerce.number().int().positive()` | Validate trước khi query |
| UC26 inheritance | Thêm function mới vào file đã có | Tránh duplicate code |
| Frontend | MUI Card layout | Phù hợp detail view |
| API response | Chuẩn success/error format | ADR-006 compliance |