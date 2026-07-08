# Research: View Pending Event (UC67)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-04

---

## 1. Reuse Existing Event Endpoint vs New Endpoint

- **Decision**: Dùng query param `status=pending` trên endpoint `GET /api/v1/events` — không tạo endpoint riêng.
- **Rationale**:
  - Context A1: Dùng query param để tái sử dụng.
  - Tránh duplicate code — cùng 1 endpoint, chỉ khác filter.
  - Dễ mở rộng: sau này có thể filter theo các status khác (approved, rejected, ongoing, completed).

## 2. Role-Based Visibility cho Event Status

- **Decision**: Service layer kiểm tra role + status param:
  - Nếu `status=pending` và user là Manager/Admin → filter `status = 'PENDING'`.
  - Nếu `status=pending` và user là Staff/Volunteer/Guest → HTTP 403 (không có quyền xem PENDING).
  - Nếu không có `status` param (Guest/Volunteer xem event list) → chỉ hiển thị event APPROVED (business rule).
- **Rationale**:
  - Chỉ Manager và Admin mới có quyền xem PENDING events.
  - Guest và Volunteer chỉ thấy event APPROVED (theo business rule: chỉ event APPROVED mới hiển thị cho Volunteer đăng ký).

## 3. Pagination

- **Decision**: Dùng Prisma `skip` + `take` pattern, kết hợp với `totalCount` query.
- **Rationale**: Spec yêu cầu hỗ trợ phân trang. Page-based phù hợp.

## 4. Zod Schema

- **Decision**: Schema cho query params: page, limit, status (enum).
- **Pattern**:
  ```js
  export const getEventsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['pending', 'approved', 'rejected', 'ongoing', 'completed']).optional()
  });
  ```

## 5. Event Model (Prisma)

- **Decision**: Event model cần có: event_id, title, description, organization_id, status, created_at, updated_at.
- **Rationale**: Status field để filter PENDING/APPROVED/REJECTED/ONGOING/COMPLETED.

## 6. Response Format

- **Decision**: Trả về mảng events + pagination metadata theo chuẩn ADR-006.
- **Pattern**: `{ "success": true, "data": { "events": [...], "pagination": {...} } }`

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Endpoint | GET /api/v1/events?status=pending | Tái sử dụng, context A1 |
| Role-based visibility | Manager/Admin → PENDING; Staff/Volunteer/Guest → 403 | Spec FR-004 |
| Default visibility (no status) | Guest/Volunteer → only APPROVED | Business rule |
| Pagination | Prisma skip/take + count | Page-based |
| Zod schema | page, limit, status enum | Validation |
| Response format | ADR-006 với pagination | Chuẩn VMS |