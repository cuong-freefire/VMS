# Research: View User List (UC26)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Pagination với Prisma (Backend)

- **Decision**: Sử dụng Prisma `skip` + `take` pattern, kết hợp với `totalCount` query để tính tổng số trang.
- **Rationale**:
  - Prisma hỗ trợ sẵn `skip` và `take` parameters cho pagination.
  - Cần query `count()` riêng biệt để biết tổng số records (dùng cho frontend pagination UI).
  - Không dùng cursor-based pagination vì page-based phù hợp cho admin table.
- **Alternatives considered**: Cursor-based pagination (không phù hợp vì admin cần jump đến page cụ thể).
- **Pattern**:
  ```js
  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take, where, orderBy }),
    prisma.user.count({ where })
  ]);
  ```

## 2. Search & Filter với Prisma (Backend)

- **Decision**: Dùng `contains` + `mode: 'insensitive'` cho search, `equals` cho role filter.
- **Rationale**:
  - `contains` với `insensitive` mode hỗ trợ tìm kiếm không phân biệt hoa/thường theo yêu cầu FR-003.
  - MySQL mặc định case-insensitive nhưng dùng Prisma `mode` để đảm bảo consistency.
- **Alternatives considered**: Raw SQL LIKE (mất type-safety của Prisma).
- **Pattern**:
  ```js
  const where = {
    AND: [
      search ? {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      role ? { role: { name: { equals: role, mode: 'insensitive' } } } : {}
    ]
  };
  ```

## 3. Role-Based Authorization (Backend)

- **Decision**: Tạo middleware `authorize.middleware.js` riêng biệt, kiểm tra `req.user.role` sau authMiddleware.
- **Rationale**:
  - `auth.middleware.js` hiện tại extract JWT → `req.user` với payload decode từ `signAccessToken`.
  - Cần tách biệt authentication (xác thực) và authorization (phân quyền) — separation of concerns.
  - Middleware chain: `authMiddleware` → `authorize('ADMIN')` → controller.
- **Pattern**:
  ```js
  // authorize.middleware.js
  export default function authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('Forbidden', 'FORBIDDEN'));
      }
      next();
    };
  }
  ```

## 4. JWT Payload & User Identity (Current System)

- **Decision**: Hệ thống hiện tại dùng `signAccessToken(payload)` với payload là object user (có `email`, `name`). Cần mở rộng payload để chứa `role` và `user_id` cho authorization.
- **Rationale**:
  - JWT hiện tại đang dùng data từ accounts array mock `{ email, password, name }` — chưa có role.
  - Khi database có User model thật, payload cần chứa `user_id`, `email`, `name`, `role` để middleware có thể kiểm tra quyền.
- **Implementation note**: Việc mở rộng JWT payload thuộc scope của Auth module (UC03), không thuộc UC26. UC26 chỉ cần consume `req.user.role` nếu đã có.

## 5. Frontend: MUI Table + Search + Filter + Pagination

- **Decision**: Dùng Material UI `Table` component kết hợp với React state management cho search/filter/pagination.
- **Rationale**:
  - MUI Table có sẵn sortable columns, striped rows, responsive design.
  - Kết hợp với `TextField` cho search bar và `Select` cho role filter dropdown.
  - Pagination dùng MUI `TablePagination` component.
- **Pattern**:
  - State: `search`, `role`, `page`, `limit` — trigger API call on change.
  - Axios GET với query params: `?search=&role=&page=1&limit=20&sort=created_at:desc`

## 6. API Response Format (Existing Standard)

- **Decision**: Tuân thủ chuẩn ADR-006 dùng `response.util.js`.
- **Pattern** cho danh sách phân trang:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách người dùng thành công",
    "data": {
      "users": [...],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 50,
        "totalPages": 3
      }
    }
  }
  ```

## 7. Error Response Patterns

- **Pattern**: Dùng `ServiceError` class từ `response.util.js` để ném lỗi có structure ở Service layer.
  ```js
  throw new ServiceError('message', 400, 'BAD_REQUEST', details);
  ```
- **Controller handler**: Catch error → `errorResponse(error.message, error.code, error.details)` với `res.status(error.status)`.

## 8. Swagger Documentation

- **Pattern**: Sử dụng JSDoc comments với `@swagger` tag ngay trên route handler.
- **Required sections**: summary, description (với example), tags, security, parameters (query), responses (200, 400, 401, 403, 500).

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Pagination backend | Prisma skip/take + count | Page-based phù hợp admin UI |
| Search backend | Prisma `contains` + `mode: insensitive` | Case-insensitive search theo FR-003 |
| Authorization | Middleware riêng `authorize.middleware.js` | Separation of concerns |
| Frontend table | MUI Table + TablePagination | Sẵn có trong tech stack |
| API response | Chuẩn success/error format | ADR-006 compliance |
| Error handling | ServiceError + Controller catch | Nhất quán toàn hệ thống |