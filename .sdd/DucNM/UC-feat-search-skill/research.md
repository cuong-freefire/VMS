# Research: Search Skill

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Extending Zod Schema with Search Param

- **Decision**: Mở rộng `getSkillsQuerySchema` (đã có từ UC34) — thêm field `search` (string, optional).
- **Rationale**:
  - Không tạo schema mới — search là extension của endpoint hiện tại.
  - `search` là string — dùng `z.string().trim().optional()`.
  - Trim whitespace để tránh search với khoảng trắng đầu/cuối.
- **Pattern**:
  ```js
  export const getSkillsQuerySchema = z.object({
    search: z.string().trim().optional()  // New field for Search Skill
  });
  ```

## 2. Prisma Where Clause cho Search

- **Decision**: Sử dụng Prisma `contains` + `mode: 'insensitive'` trên cả `name` và `description`, kết hợp OR logic.
- **Rationale**:
  - `contains` hỗ trợ partial match — tương đương SQL `LIKE '%keyword%'`.
  - `mode: 'insensitive'` cho case-insensitive search.
  - OR logic để search đồng thời trên cả `name` và `description` (theo spec FR-001).
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
  ```

## 3. Role-Based Filtering khi Search

- **Decision**: Giữ nguyên role-based filtering từ UC34 — Manager thấy active + inactive, Volunteer/Staff chỉ thấy active, Guest bị từ chối HTTP 401.
- **Rationale**:
  - UC34 đã có middleware check role và filter `is_active`.
  - Search condition thêm vào cùng Prisma where — không ảnh hưởng role-based filtering.
  - Nếu Guest gọi API, auth middleware trả về 401 trước khi đến service layer.

## 4. Frontend: SearchInput Component

- **Decision**: Tái sử dụng `SearchInput.jsx` component — tương tự search-user và search-category.
- **Rationale**:
  - Reusable component giảm code duplicate, đảm bảo UI consistency.
  - Debounce 300ms vẫn phù hợp cho skill search.
  - Khác biệt duy nhất: placeholder text và API endpoint (`/api/v1/skills`).

## 5. Không thay đổi Database Schema

- **Rationale**: `name` và `description` columns đã có trong skills table từ UC34. Số lượng skill ít nên LIKE query đủ nhanh.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | Extend existing — thêm search param | Không tạo schema mới |
| Search fields | name + description (OR logic) | Search đồng thời trên cả 2 field |
| Role-based filtering | Giữ nguyên từ UC34 | Manager thấy active + inactive, Volunteer/Staff chỉ active, Guest 401 |
| Frontend component | Reuse SearchInput | Consistency, giảm code duplicate |
| Database | Không thay đổi | Columns đã có sẵn |