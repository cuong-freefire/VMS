# Research: Search User

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Extending Zod Schema with Search Param

- **Decision**: Mở rộng `getUsersQuerySchema` (đã có từ UC26) — thêm field `search` (string, optional).
- **Rationale**:
  - Không tạo schema mới — search là extension của endpoint hiện tại.
  - `search` là string — dùng `z.string().optional()`.
  - Không giới hạn độ dài tối thiểu (1 ký tự vẫn search được) nhưng trim whitespace.
  - Sanitize input: Zod tự động escape special characters — Prisma ORM parameterized queries chống SQL injection.
- **Pattern**:
  ```js
  export const getUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),  // New field for Search User
    role: z.enum(['volunteer', 'staff', 'manager', 'admin']).optional(),
    sort: z.string().regex(/^(created_at|full_name|email):(asc|desc)$/).default('created_at:desc'),
    is_active: z.coerce.boolean().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  });
  ```

## 2. Prisma Where Clause cho Search

- **Decision**: Sử dụng Prisma `contains` + `mode: 'insensitive'` trên cả `full_name` và `email`, kết hợp OR logic.
- **Rationale**:
  - `contains` tương đương SQL `LIKE '%keyword%'` — hỗ trợ partial match.
  - `mode: 'insensitive'` cho case-insensitive search trên MySQL.
  - OR logic để search đồng thời trên cả `full_name` và `email`.
  - Nếu `search` rỗng hoặc undefined — bỏ qua, không ảnh hưởng đến query.
- **Pattern**:
  ```js
  if (search) {
    where.AND.push({
      OR: [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    });
  }
  ```

## 3. Case-Insensitive Search trên MySQL

- **Decision**: Dùng Prisma `mode: 'insensitive'` — MySQL hỗ trợ native case-insensitive cho `VARCHAR` columns với `utf8mb4_unicode_ci` collation.
- **Rationale**:
  - Prisma `mode: 'insensitive'` tự động áp dụng collation phù hợp.
  - MySQL mặc định `utf8mb4_unicode_ci` đã là case-insensitive — `contains` đã không phân biệt hoa/thường.
  - Thêm `mode: 'insensitive'` để đảm bảo consistent behavior giữa các database.
- **Performance note**: `LIKE '%keyword%'` không dùng được index. Với số lượng user < 10,000, performance vẫn acceptable (< 200ms).

## 4. Kết hợp Search với Filter (AND logic)

- **Decision**: Search condition được thêm vào mảng `where.AND` cùng với các filter params khác.
- **Rationale**:
  - Prisma AND array tự động kết hợp tất cả conditions.
  - Search + Filter hoạt động đồng thời: `?search=nguyen&role=staff&is_active=true`.
  - Search là optional — nếu không có, chỉ filter như bình thường.

## 5. Frontend: SearchInput Component

- **Decision**: Tạo `SearchInput.jsx` — reusable search input component với debounce 300ms.
- **Rationale**:
  - Debounce 300ms giúp giảm số lượng API call khi user gõ nhanh.
  - Reusable component có thể dùng lại cho search-category, search-skill, search-organization.
  - Kết hợp với URL query params để preserve search state khi reload page.
- **Pattern**:
  ```jsx
  // SearchInput
  <TextField
    value={searchTerm}
    onChange={handleChange}
    placeholder="Search by name or email..."
    InputProps={{ endAdornment: searchTerm && <IconButton onClick={handleClear}>x</IconButton> }}
  />
  ```

## 6. Không thay đổi Controller/Repository

- **Rationale**: Controller pass `req.query` xuống service. Repository nhận `where` object đã được service xây dựng. Chỉ cần thay đổi validator schema (thêm search param) và service logic (thêm search condition).

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | Extend existing — thêm search param (string, optional) | Không tạo schema mới |
| Search mechanism | Prisma `contains` + `mode: 'insensitive'` | Case-insensitive partial match |
| Search fields | full_name + email (OR logic) | Search đồng thời trên cả 2 field |
| Kết hợp filter | Thêm vào mảng AND | AND logic với các filter khác |
| Frontend component | SearchInput với debounce 300ms | Giảm API calls, reusable |
| Controller/Repo | Không thay đổi | Chỉ thay đổi validator + service |