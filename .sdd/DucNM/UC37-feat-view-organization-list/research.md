# Research: View Organization List (UC37)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-02

---

## 1. Organization Model

- **Decision**: Model Organization với các fields: `organization_id`, `name`, `description`, `address`, `contact_phone`, `contact_email`, `website`, `logo_url`, `is_active`, `created_at`, `updated_at`.
- **Rationale**: Đầy đủ thông tin liên hệ cho một tổ chức. `is_active` cho soft delete theo ADR-005.

## 2. Role-Based Visibility

- **Decision**: Service layer kiểm tra role của user:
  - `req.user` là Admin → không filter `is_active` (thấy tất cả).
  - `req.user` là Manager/Staff → chỉ lấy `is_active = true`.
  - `req.user` là Volunteer → chỉ lấy `is_active = true` (phục vụ UC11).
  - Không có `req.user` (Guest) → chỉ lấy `is_active = true` (phục vụ UC11).
- **Rationale**: Guest và Volunteer cần organizations active cho UC11 Filter Event.

## 3. Optional Auth Pattern cho Guest/Volunteer Access

- **Decision**: Dùng `optionalAuth` middleware (tái sử dụng từ UC31) — 1 route duy nhất.
- **Rationale**: UC11 cần Guest và Volunteer xem organizations active. 1 route duy nhất đơn giản hơn.

## 4. Pagination với Prisma

- **Decision**: Dùng Prisma `skip` + `take` pattern, kết hợp với `totalCount` query.
- **Rationale**: Spec yêu cầu hỗ trợ phân trang. Page-based phù hợp cho admin table.
- **Pattern**: `[data, total] = await Promise.all([findMany({skip, take, where}), count({where})])`

## 5. Search với Prisma

- **Decision**: Dùng `contains` + `mode: 'insensitive'` cho search theo tên.
- **Rationale**: Case-insensitive search theo spec.

## 6. Zod Schema

- **Decision**: Schema cho query params: page, limit, search — tương tự UC26.
- **Rationale**: Pattern giống User Management.

## 7. Response Format

- **Decision**: Trả về mảng organizations + pagination metadata theo chuẩn ADR-006.
- **Pattern**: `{ "success": true, "data": { "organizations": [...], "pagination": {...} } }`

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Auth pattern | Optional auth middleware (từ UC31) | 1 route, hỗ trợ Guest + UC11 |
| Role-based visibility | Service check req.user role | Separation of concerns |
| Pagination | Prisma skip/take + count | Page-based, pattern UC26 |
| Search | Prisma contains + insensitive | Case-insensitive |
| Response format | ADR-006 với pagination | Chuẩn VMS |