# Research: Reject Event (UC70)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-06

---

## 1. Endpoint Design: PATCH /api/v1/events/:id/reject

- **Decision**: Dùng `PATCH` method với sub-route `/reject` — action-based endpoint.
- **Rationale**:
  - PATCH cho partial update — chỉ thay đổi status, rejection_reason, rejected_by, rejected_at.
  - Sub-route `/reject` rõ ràng về hành động (giống pattern UC69 approve).
  - RESTful convention: `PATCH /resource/:id/action`.

## 2. Zod Schema cho Reject Event

- **Decision**: Dùng `z.object()` với `rejection_reason` (bắt buộc, min 10 ký tự).
- **Rationale**:
  - Spec FR-003: rejection_reason bắt buộc, tối thiểu 10 ký tự.
- **Pattern**:
  ```js
  export const rejectEventSchema = z.object({
    rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters')
  });
  ```

## 3. Status Validation: Chỉ cho phép PENDING → REJECTED

- **Decision**: Service kiểm tra event.status === 'PENDING' trước khi reject.
- **Rationale**:
  - Spec FR-002: Chỉ cho phép từ chối event có status = PENDING.
  - Nếu status khác (APPROVED, REJECTED, ONGOING, COMPLETED) → HTTP 409.

## 4. Audit Trail: rejection_reason + rejected_by + rejected_at

- **Decision**: Lưu `rejection_reason` (string), `rejected_by` (user_id từ JWT), `rejected_at` (current timestamp).
- **Rationale**:
  - Spec FR-004: ghi nhận rejection_reason, rejected_by, rejected_at.
  - `rejected_by` là foreign key đến User table.

## 5. Prisma Schema Update

- **Decision**: Thêm 3 fields vào Event model: `rejection_reason` (String?), `rejected_by` (Int? FK → User), `rejected_at` (DateTime?).
- **Rationale**: Cần lưu thông tin người từ chối, lý do và thời gian.

## 6. Audit Log

- **Decision**: Dùng Pino logger để ghi log sau khi reject thành công.
- **Rationale**: Lesson 4 từ CLAUDE.md — audit log bất đồng bộ.

## 7. Authorization: Manager/Admin

- **Decision**: Dùng `authorize('MANAGER', 'ADMIN')` middleware.
- **Rationale**: Chỉ Manager và Admin mới có quyền từ chối.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Endpoint | PATCH /api/v1/events/:id/reject | Action-based, pattern UC69 |
| Zod schema | rejection_reason required, min 10 | Spec FR-003 |
| Status validation | Chỉ PENDING → REJECTED | Spec FR-002 |
| Audit trail | rejection_reason + rejected_by + rejected_at | Spec FR-004 |
| Prisma update | Thêm 3 fields | Lưu thông tin từ chối |
| Audit log | Pino async log | Lesson 4 |
| Authorization | authorize('MANAGER', 'ADMIN') | Manager/Admin |