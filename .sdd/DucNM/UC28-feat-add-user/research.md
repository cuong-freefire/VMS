# Research: Add User (UC28)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Request Body Validation with Zod

- **Decision**: Dùng `z.object()` schema với `full_name`, `email`, `phone` (optional), `password`, `role_id`.
- **Rationale**:
  - Zod là validation library bắt buộc theo tech stack VMS (ADR-003).
  - `safeParse` trả về lỗi chi tiết cho từng field — giúp frontend hiển thị error message cụ thể.
  - Dùng `z.string().email()` cho email validation built-in.
- **Pattern**:
  ```js
  export const createUserSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role_id: z.number().int().positive('Role is required')
  });
  ```

## 2. Password Hashing with bcryptjs

- **Decision**: Dùng `bcryptjs.hash(password, saltRounds)` với salt rounds = 10.
- **Rationale**:
  - bcryptjs là thư viện bắt buộc theo VMS tech stack.
  - Salt rounds = 10 là balance giữa security và performance (khoảng 100-200ms).
  - `bcryptjs` là pure JavaScript implementation — không cần native dependencies.
- **Pattern**:
  ```js
  import bcrypt from 'bcryptjs';
  const hashedPassword = await bcrypt.hash(password, 10);
  ```

## 3. Email Uniqueness Check (kể cả inactive users)

- **Decision**: Dùng `prisma.user.findUnique({ where: { email } })` để kiểm tra email tồn tại. Nếu có user với email đó (dù active hay inactive), trả về 409 Conflict.
- **Rationale**:
  - Spec yêu cầu: "Nếu email đã tồn tại dưới dạng inactive, không thể tạo user mới với email đó."
  - Unique constraint trong database sẽ catch race condition, nhưng check trước trong service cho user experience tốt hơn.
- **Pattern**:
  ```js
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ServiceError('Email already exists.', 409, 'EMAIL_EXISTS');
  }
  ```

## 4. Role Validation

- **Decision**: Kiểm tra `role_id` tồn tại trong bảng Role trước khi tạo user. fallback: dùng `findUnique` trên Role table.
- **Rationale**:
  - Role là foreign key constraint ở database — cần đảm bảo role_id hợp lệ.
  - Nếu role_id không tồn tại, trả về 400 Bad Request thay vì 500 Internal Server Error từ database.
- **Pattern**:
  ```js
  const role = await prisma.role.findUnique({ where: { role_id } });
  if (!role) {
    throw new ServiceError('Invalid role.', 400, 'INVALID_ROLE');
  }
  ```

## 5. Response: Exclude Password Field

- **Decision**: Khi trả về user mới tạo, dùng Prisma `select` để exclude password field.
- **Rationale**:
  - Không bao giờ trả password (dù đã hash) ra ngoài API response.
  - `select` tốt hơn `include` vì chỉ lấy đúng fields cần thiết.
- **Pattern**:
  ```js
  const user = await prisma.user.create({
    data: { full_name, email, phone, password: hashedPassword, role_id, is_active: true },
    select: {
      user_id: true, full_name: true, email: true, phone: true,
      avatar_url: true, is_active: true, created_at: true, updated_at: true,
      role: { select: { name: true } }
    }
  });
  ```

## 6. Transaction cho Create User

- **Decision**: Dùng Prisma transaction để đảm bảo atomicity cho create user operation.
- **Rationale**:
  - Mặc dù create user đơn giản (1 table), nhưng nếu sau này mở rộng (ví dụ tạo notification), transaction sẽ giúp rollback.
  - Best practice theo ADR-001.
- **Pattern**: Prisma `$transaction` nếu cần nhiều operations. Cho create user đơn, `prisma.user.create` tự động là 1 operation.

## 7. Frontend: Form Validation

- **Decision**: Dùng React Hook Form + Zod resolver để validation đồng bộ giữa frontend và backend.
- **Rationale**:
  - React Hook Form là bắt buộc theo VMS tech stack.
  - `@hookform/resolvers/zod` cho phép dùng cùng Zod schema ở frontend.
  - Validation trước khi submit — giảm request không hợp lệ đến server.
- **Pattern**:
  ```jsx
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { createUserSchema } from '../../validators/user.validator';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createUserSchema)
  });
  ```

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Validation | Zod `safeParse` với error messages chi tiết | Bắt buộc theo VMS stack |
| Password hash | bcryptjs với salt rounds = 10 | Balance security/performance |
| Email uniqueness | Check trước trong service + DB unique constraint | User experience + safety |
| Role validation | Query Role table, throw 400 nếu không hợp lệ | Tránh DB foreign key error |
| Exclude password | Prisma `select` — không lấy password field | Security best practice |
| Frontend form | React Hook Form + Zod resolver | Validation đồng bộ FE/BE |