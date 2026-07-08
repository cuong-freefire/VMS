# Research: View Category List (UC31)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Role-Based Visibility cho Category

- **Decision**: Service layer kiểm tra role của user để quyết định filter `is_active` hay không.
  - Nếu `req.user` là Manager/Admin → không filter `is_active` (thấy tất cả).
  - Nếu `req.user` là Staff/Volunteer → chỉ lấy `is_active = true`.
  - Nếu không có `req.user` (Guest/public) → chỉ lấy `is_active = true`.
- **Rationale**:
  - Guest và Volunteer cần xem categories active để phục vụ UC11 (Filter Event).
  - Manager/Admin cần thấy cả inactive để quản lý.
- **Implementation approach**: 2 routes cho cùng endpoint:
  - `GET /api/v1/categories/public` — public, không cần auth, trả về active only
  - `GET /api/v1/categories` — có auth, role-based visibility
  Hoặc 1 route duy nhất với optional auth middleware (nếu có user thì check role, nếu không thì mặc là Guest → active only).

## 2. Optional Auth Pattern cho Guest Access

- **Decision**: Dùng 1 route duy nhất với middleware pattern: nếu có token → authenticate + check role-based visibility; nếu không có token → treat as Guest → active only.
- **Rationale**:
  - UC11 (Filter Event) cần gọi API categories từ frontend khi Guest chưa login. Nếu tách 2 routes, frontend phải logic phức tạp.
  - 1 route duy nhất đơn giản hơn: frontend luôn gọi `GET /api/v1/categories`, BE tự quyết định dựa trên auth state.
- **Pattern**: Tạo middleware `optionalAuth` — giống `authMiddleware` nhưng không trả về 401 nếu không có token, chỉ set `req.user = null`.

## 3. Prisma Schema cho Category

- **Decision**: Model Category với các fields: `category_id`, `name`, `description`, `type`, `is_active`, `created_at`, `updated_at`.
- **Rationale**:
  - `type` dùng để phân loại category: location, event_type, time_frame.
  - `is_active` cho soft delete theo ADR-005.
- **Pattern**:
  ```prisma
  model Category {
    category_id Int      @id @default(autoincrement())
    name        String   @db.VarChar(255)
    description String?  @db.Text
    type        String   @db.VarChar(50)
    is_active   Boolean  @default(true)
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@map("categories")
  }
  ```

## 4. Zod Schema cho Category Query

- **Decision**: Không cần Zod schema phức tạp vì GET categories không có query params (không pagination, không filter — role-based filter handled bởi service).
- **Rationale**: Endpoint đơn giản — chỉ GET all categories với role-based visibility trong service.

## 5. Response Format

- **Decision**: Trả về mảng categories trong `data` field theo chuẩn ADR-006.
- **Pattern**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách danh mục thành công",
    "data": {
      "categories": [
        {
          "category_id": 1,
          "name": "Giáo dục",
          "description": "Các sự kiện liên quan đến giáo dục",
          "type": "event_type",
          "is_active": true
        }
      ]
    }
  }
  ```

## 6. Module Structure (New Module)

- **Decision**: Tạo mới toàn bộ files cho Category module — không kế thừa từ User Management.
- **Files cần tạo**:
  - `backend/prisma/schema.prisma` — thêm Category model
  - `backend/src/controllers/category.controller.js`
  - `backend/src/services/category.service.js`
  - `backend/src/repositories/category.repository.js`
  - `backend/src/routes/category.routes.js`
  - `backend/src/validators/category.validator.js`
  - `backend/src/middleware/optionalAuth.middleware.js` — cho Guest access
  - `frontend/src/api/categoryApi.js`
  - `frontend/src/hooks/useCategories.js`
  - `frontend/src/components/pages/CategoryListPage.jsx`

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Auth pattern | Optional auth middleware — 1 route duy nhất | Đơn giản cho FE, hỗ trợ Guest từ UC11 |
| Role-based visibility | Service layer check req.user role | Separation of concerns |
| Prisma model | Category với name, description, type, is_active | Theo spec |
| Zod schema | Không cần phức tạp | GET endpoint đơn giản |
| Response format | ADR-006 với mảng categories | Chuẩn VMS |
| Module structure | Tạo mới toàn bộ | Module mới, không kế thừa |