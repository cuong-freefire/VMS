# Research: Filter User (UC30)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Extending Zod Schema with Filter Params

- **Decision**: Mở rộng `getUsersQuerySchema` (đã có từ UC26) — thêm các field `is_active`, `from_date`, `to_date`.
- **Rationale**:
  - Không tạo schema mới — filter là extension của endpoint hiện tại.
  - `is_active` là boolean — dùng `z.coerce.boolean()` để parse từ query string.
  - `from_date` và `to_date` là date string — dùng `z.string().date()` hoặc `z.string().datetime()`.
  - Date validation (`from_date <= to_date`) sẽ dùng `.refine()`.
- **Pattern**:
  ```js
  export const getUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['volunteer', 'staff', 'manager', 'admin']).optional(),
    sort: z.string().regex(/^(created_at|full_name|email):(asc|desc)$/).default('created_at:desc'),
    // New fields for UC30
    is_active: z.coerce.boolean().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
  }).refine(data => {
    if (data.from_date && data.to_date) {
      return new Date(data.from_date) <= new Date(data.to_date);
    }
    return true;
  }, { message: 'from_date must be before or equal to to_date', path: ['from_date'] });
  ```

## 2. Prisma Where Clause cho Filter

- **Decision**: Mở rộng Prisma `where` clause trong `getUsers` service — thêm điều kiện cho `is_active` và `created_at` range.
- **Rationale**:
  - `is_active` filter: đơn giản — `{ is_active: true/false }`.
  - Date range filter: dùng Prisma `gte` và `lte` trên `created_at` field.
  - AND logic: tất cả filter params được thêm vào mảng `AND`.
- **Pattern**:
  ```js
  if (is_active !== undefined) {
    where.AND.push({ is_active });
  }

  if (from_date) {
    where.AND.push({ created_at: { gte: new Date(from_date) } });
  }

  if (to_date) {
    // Set to end of day for inclusive range
    const toDateEnd = new Date(to_date);
    toDateEnd.setHours(23, 59, 59, 999);
    where.AND.push({ created_at: { lte: toDateEnd } });
  }
  ```

## 3. Date Range Validation

- **Decision**: Validate date range ở cả Zod schema (`.refine()`) và service layer (double-check).
- **Rationale**:
  - Zod `.refine()` bắt lỗi ngay từ validation layer — trả về 400 nhanh chóng.
  - Service layer double-check để đảm bảo an toàn (defense in depth).
- **Date format**: `YYYY-MM-DD` (ISO 8601).
- **Inclusive range**: `to_date` bao gồm cả ngày cuối (set time về 23:59:59.999).

## 4. Frontend: Filter UI Components

- **Decision**: Thêm 2 components mới: `ActiveFilter.jsx` (Toggle button group) và `DateRangeFilter.jsx` (2 date inputs).
- **Rationale**:
  - Active/Inactive filter: dùng MUI `ToggleButtonGroup` — trực quan hơn dropdown.
  - Date range: dùng MUI `TextField` với `type="date"` — built-in date picker.
  - Các filter trigger API call ngay khi thay đổi (giống search).
- **Pattern**:
  ```jsx
  // ActiveFilter
  <ToggleButtonGroup value={isActive} exclusive onChange={handleActiveChange}>
    <ToggleButton value="">All</ToggleButton>
    <ToggleButton value="true">Active</ToggleButton>
    <ToggleButton value="false">Inactive</ToggleButton>
  </ToggleButtonGroup>

  // DateRangeFilter
  <TextField type="date" label="From" value={fromDate} onChange={...} />
  <TextField type="date" label="To" value={toDate} onChange={...} />
  ```

## 5. Kết hợp Search + Filter (AND logic)

- **Decision**: Search, role filter, active filter, date range filter đều dùng AND logic trong Prisma `where` clause.
- **Rationale**:
  - Tất cả params được đẩy vào mảng `where.AND` — Prisma tự động AND giữa các điều kiện.
  - Có thể kết hợp tất cả filter cùng lúc: `?search=nguyen&role=staff&is_active=true&from_date=2026-01-01&to_date=2026-06-30`.

## 6. Không thay đổi Controller/Repository

- **Rationale**: Controller chỉ pass `req.query` xuống service (đã làm từ UC26). Repository `findUsers` nhận `where` object đã được service xây dựng. Chỉ cần thay đổi validator schema và service logic.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | Extend existing — thêm is_active, from_date, to_date | Không tạo schema mới |
| Date validation | Zod `.refine()` + service double-check | Defense in depth |
| Date range inclusive | Set to_date về 23:59:59.999 | Bao gồm cả ngày cuối |
| Prisma where | Thêm vào mảng AND | AND logic giữa các filter |
| Frontend Filter | ActiveFilter (ToggleButton) + DateRangeFilter (date inputs) | UX tốt hơn dropdown |
| Controller/Repo | Không thay đổi | Chỉ thay đổi validator + service |