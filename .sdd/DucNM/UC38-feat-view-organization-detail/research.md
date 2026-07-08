# Research: View Organization Detail (UC38)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-02

---

## 1. Two Levels of Detail (Basic vs Full)

- **Decision**: Service layer trả về 2 levels of detail dựa trên role:
  - **Basic** (Volunteer/Guest): Chỉ gồm `organization_id`, `name`, `description`, `logo_url`, `is_active`. Không có contact info, không có events list.
  - **Full** (Staff/Manager/Admin): Tất cả fields + danh sách tối đa 10 sự kiện gần nhất.
- **Rationale**:
  - UC09 cần hiển thị thông tin cơ bản của tổ chức chủ quản sự kiện cho Volunteer và Guest.
  - Contact info (phone, email, address) là dữ liệu quản trị, không public.
  - Dùng chung 1 endpoint `GET /api/v1/organizations/:id` với `optionalAuth` — service quyết định level dựa trên `req.user`.

## 2. Optional Auth Pattern cho Guest/Volunteer

- **Decision**: Dùng `optionalAuth` middleware (giống UC31/UC37) — 1 route duy nhất.
- **Rationale**:
  - Guest (không token) gọi endpoint → basic info.
  - Volunteer (có token, role VOLUNTEER) → basic info.
  - Staff/Manager (có token, role STAFF/MANAGER) → full info.
  - Admin (có token, role ADMIN) → full info + thấy cả inactive.

## 3. 404 Handling cho Manager/Staff khi Organization Inactive

- **Decision**: Nếu Manager/Staff gọi endpoint với organization inactive → trả về 404 (không lộ sự tồn tại).
- **Rationale**: Spec FR-004 yêu cầu không tiết lộ tồn tại của org inactive với Manager/Staff.
- **Pattern**:
  ```js
  if (existingOrg && !existingOrg.is_active && role !== 'ADMIN') {
    throw new ServiceError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
  }
  ```

## 4. Events Summary (tối đa 10 sự kiện gần nhất)

- **Decision**: Dùng Prisma `findMany` với `take: 10`, `orderBy: { created_at: 'desc' }` trên Event model.
- **Rationale**: Spec yêu cầu tối đa 10 sự kiện gần nhất. Chỉ Staff/Manager/Admin mới thấy events summary.
- **Pattern**: Chỉ query events khi role là STAFF/MANAGER/ADMIN.

## 5. Basic Info Fields Selection

- **Decision**: Dùng Prisma `select` để chỉ lấy basic fields cho Volunteer/Guest.
- **Pattern**:
  ```js
  const basicSelect = {
    organization_id: true, name: true, description: true, logo_url: true, is_active: true
  };
  ```

## 6. Response Format

- **Decision**: Trả về organization trong `data` field theo chuẩn ADR-006.
- **Full response** bao gồm `events` array.
- **Basic response** không bao gồm `events`.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Detail levels | Basic (Volunteer/Guest) vs Full (Staff/Manager/Admin) | UC09 cần basic info public |
| Auth pattern | Optional auth middleware | 1 route, Guest không token |
| 404 for inactive | Manager/Staff → 404 | FR-004, không lộ tồn tại |
| Events limit | Max 10, newest first | Spec A2 |
| Events visibility | Chỉ Staff/Manager/Admin | Basic view không có events |
| Basic fields | name, description, logo_url, is_active | Đủ cho UC09 hiển thị |