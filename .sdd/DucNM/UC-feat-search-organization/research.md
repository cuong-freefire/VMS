# Research: Search Organization

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Extending Zod Schema with Search Param

- **Decision**: Mở rộng `getOrganizationsQuerySchema` (đã có từ UC37) — thêm field `search` (string, optional).
- **Rationale**:
  - Không tạo schema mới — search là extension của endpoint hiện tại.
  - `search` là string — dùng `z.string().trim().optional()`.
  - Trim whitespace để tránh search với khoảng trắng đầu/cuối.
- **Pattern**:
  ```js
  export const getOrganizationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),  // New field for Search Organization
    is_active: z.coerce.boolean().optional()
  });
  ```

## 2. Prisma Where Clause cho Search

- **Decision**: Sử dụng Prisma `contains` + `mode: 'insensitive'` trên `name` — chỉ search theo tên (theo context.md answer A2 và spec FR-001).
- **Rationale**:
  - `contains` hỗ trợ partial match — tương đương SQL `LIKE '%keyword%'`.
  - `mode: 'insensitive'` cho case-insensitive search.
  - Search scope chỉ `name` — KHÔNG search theo email hoặc địa chỉ (theo spec Out of Scope).
  - Kết hợp AND với filter `is_active` param.
- **Pattern**:
  ```js
  if (search) {
    where.AND.push({
      name: { contains: search, mode: 'insensitive' }
    });
  }

  if (is_active !== undefined) {
    where.AND.push({ is_active });
  }
  ```

## 3. Role-Based Filtering khi Search

- **Decision**: Giữ nguyên role-based filtering từ UC37 — Admin thấy active + inactive, Manager/Staff chỉ thấy active, Volunteer và Guest bị từ chối (HTTP 403/401).
- **Rationale**:
  - UC37 đã có middleware check role và logic lọc `is_active` theo role.
  - Search condition thêm vào cùng Prisma where — không ảnh hưởng role-based filtering.
  - Volunteer và Guest không có quyền xem organization, auth middleware chặn trước khi đến service.

## 4. Kết hợp Search với Filter is_active

- **Decision**: Search và filter `is_active` kết hợp bằng AND logic — cùng trong mảng `where.AND`.
- **Rationale**:
  - Admin muốn search organization active: `?search=Nhan&is_active=true`.
  - Manager muốn search organization: `?search=Hoa` (mặc định chỉ thấy active do role-based filtering).

## 5. Frontend: SearchInput Component

- **Decision**: Tái sử dụng `SearchInput.jsx` component — tương tự các search feature khác.
- **Rationale**:
  - Reusable component giảm code duplicate, đảm bảo UI consistency.
  - Debounce 300ms vẫn phù hợp cho organization search.
  - Khác biệt: placeholder text và API endpoint (`/api/v1/organizations`).

## 6. Không thay đổi Database Schema

- **Rationale**: `name` column đã có trong organizations table từ UC37. Số lượng organization ít nên LIKE query đủ nhanh.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | Extend existing — thêm search param | Không tạo schema mới |
| Search field | Chỉ name — KHÔNG search email/address | Theo spec Out of Scope |
| Search + is_active filter | AND logic | Kết hợp được với filter |
| Role-based filtering | Giữ nguyên từ UC37 | Admin thấy active + inactive, Manager/Staff chỉ active, Volunteer/Guest bị từ chối |
| Frontend component | Reuse SearchInput | Consistency, giảm code duplicate |
| Database | Không thay đổi | Column đã có sẵn |