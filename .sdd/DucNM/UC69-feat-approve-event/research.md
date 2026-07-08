# Research: Approve Event (UC69)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-06

---

## 1. Endpoint Design: PATCH /api/v1/events/:id/approve

- **Decision**: Dùng `PATCH` method với sub-route `/approve` — không dùng `PUT` vì chỉ update status.
- **Rationale**:
  - PATCH cho partial update — chỉ thay đổi status, approved_by, approved_at.
  - Sub-route `/approve` rõ ràng về hành động (action-based endpoint).
  - RESTful convention: `PATCH /resource/:id/action`.

## 2. Status Validation: Chỉ cho phép PENDING → APPROVED

- **Decision**: Service kiểm tra event.status === 'PENDING' trước khi approve.
- **Rationale**:
  - Spec FR-002: Chỉ cho phép phê duyệt event có status = PENDING.
  - Nếu status khác (APPROVED, REJECTED, ONGOING, COMPLETED) → HTTP 409.
- **Pattern**:
  ```js
  if (event.status !== 'PENDING') {
    throw new ServiceError('Event is not in PENDING status.', 409, 'INVALID_STATUS');
  }
  ```

## 3. Audit Trail: approved_by + approved_at

- **Decision**: Lưu `approved_by` (user_id từ JWT) và `approved_at` (current timestamp).
- **Rationale**:
  - Spec FR-003: ghi nhận approved_by và approved_at.
  - `approved_by` là foreign key đến User table.
  - `approved_at` là DateTime tự động set.
- **Pattern**:
  ```js
  const updateData = {
    status: 'APPROVED',
    approved_by: currentUser.user_id,
    approved_at: new Date()
  };
  ```

## 4. Prisma Schema Update

- **Decision**: Thêm 2 fields vào Event model: `approved_by` (Int? FK → User), `approved_at` (DateTime?).
- **Rationale**: Cần lưu thông tin người phê duyệt và thời gian phê duyệt.

## 5. Audit Log

- **Decision**: Dùng Pino logger để ghi log sau khi approve thành công.
- **Rationale**: Lesson 4 từ CLAUDE.md — audit log bất đồng bộ.

## 6. Authorization: Manager/Admin

- **Decision**: Dùng `authorize('MANAGER', 'ADMIN')` middleware.
- **Rationale**: Chỉ Manager và Admin mới có quyền phê duyệt.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Endpoint | PATCH /api/v1/events/:id/approve | Action-based, partial update |
| Status validation | Chỉ PENDING → APPROVED | Spec FR-002 |
| Audit trail | approved_by + approved_at | Spec FR-003 |
| Prisma update | Thêm 2 fields | Lưu thông tin duyệt |
| Audit log | Pino async log | Lesson 4 |
| Authorization | authorize('MANAGER', 'ADMIN') | Manager/Admin |