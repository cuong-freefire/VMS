# Research: Search Category

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Extending Zod Schema with Search Param

- **Decision**: Mở rộng `getCategoriesQuerySchema` (đã có từ UC31) — thêm field `search` (string, optional).
- **Rationale**:
  - Không tạo schema mới — search là extension của endpoint hiện tại.
  - `search` là string — dùng `z.string().trim().optional()`.
  - Trim whitespace để tránh search với khoảng trắng đầu/cuối.
- **Pattern**:
  ```js
  export const getCategoriesQuerySchema = z.object({
    search: z.string().trim().optional(),  // New field for Search Category
    type: z.enum(['location', 'event_type', 'time_frame']).optional()
  });
  ```

## 2. Prisma Where Clause cho Search

- **Decision**: Sử dụng Prisma `contains` + `mode: 'insensitive'` trên cả `name` và `description`, kết hợp OR logic.
- **Rationale**:
  - `contains` hỗ trợ partial match — tương đương SQL `LIKE '%keyword%'`.
  - `mode: 'insensitive'` cho case-insensitive search.
  - OR logic để search đồng thời trên cả `name` và `description` (theo spec FR-001: search theo name và description).
  - Vẫn kết hợp được với filter `type` param qua AND logic.
- **Pattern**:
  ```js
  if (search) {
    where.AND.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  if (type) {
    where.AND.push({ type });
  }
  ```

## 3. Role-Based Filtering khi Search

- **Decision**: Giữ nguyên role-based filtering từ UC31 — Manager thấy active + inactive, Staff/Volunteer/Guest chỉ thấy active. Search condition được thêm vào cùng Prisma where.
- **Rationale**:
  - UC31 đã có logic: `if (user.role === 'MANAGER') { /* show all */ } else { where.AND.push({ is_active: true }); }`.
  - Search chỉ là thêm 1 condition nữa vào mảng AND — không ảnh hưởng đến role-based filtering.
  - Guest không cần search category riêng (theo context.md answer A3).

## 4. Kết hợp Search với Filter Type

- **Decision**: Search và filter type kết hợp bằng AND logic — cùng trong mảng `where.AND`.
- **Rationale**:
  - Type filter (`location`, `event_type`, `time_frame`) là param riêng, không phải search field (theo context.md answer A2).
  - Kết hợp AND: `?search=Hoc&type=event_type` → tìm category type=event_type có tên chứa "Hoc".

## 5. Frontend: SearchInput Component

- **Decision**: Tạo hoặc tái sử dụng `SearchInput.jsx` — tương tự search-user.
- **Rationale**:
  - Giống search-user, search-category cũng cần debounce 300ms.
  - Có thể reuse cùng component với search-user để đảm bảo consistency.
  - Khác biệt: placeholder text và API endpoint gọi khác nhau.

## 6. Không thay đổi Database Schema

- **Rationale**: `name` và `description` columns đã có trong categories table từ UC31. Không cần thêm column hay index mới. Số lượng category ít (< 100) nên LIKE query đủ nhanh.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | Extend existing — thêm search param | Không tạo schema mới |
| Search fields | name + description (OR logic) | Search đồng thời trên cả 2 field |
| Search + Type filter | AND logic | Kết hợp được với filter type |
| Role-based filtering | Giữ nguyên từ UC31 | Manager thấy active + inactive |
| Frontend component | Reuse SearchInput | Consistency, giảm code duplicate |
| Database | Không thay đổi | Columns đã có sẵn |