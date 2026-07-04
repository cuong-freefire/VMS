# Research: View Pending Event Detail (UC68)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-04

---

## 1. Reuse Existing Event Detail Endpoint

- **Decision**: Tái sử dụng endpoint `GET /api/v1/events/:id` từ UC09 (View Event Detail — NamLD).
- **Rationale**:
  - Context A1: Tái sử dụng endpoint từ UC09.
  - Tránh duplicate code — cùng 1 endpoint, chỉ khác role-based visibility.
  - Manager/Admin có thể xem event ở mọi status (PENDING, APPROVED, REJECTED, etc.).
- **Implementation**: Mở rộng service `getEventById` — thêm role check: nếu user là Manager/Admin, cho phép xem event PENDING.

## 2. Role-Based Visibility cho Event Detail

- **Decision**: Service layer kiểm tra role + event status:
  - Nếu event status là PENDING và user là Manager/Admin → cho phép xem.
  - Nếu event status là PENDING và user là Staff/Volunteer → HTTP 403.
  - Nếu event status là PENDING và user là Guest → HTTP 401.
  - Nếu event status là APPROVED (hoặc khác PENDING) → tất cả authenticated users đều xem được (theo UC09 logic).
- **Rationale**: Chỉ Manager và Admin mới có quyền xem event PENDING.

## 3. Event Detail Response

- **Decision**: Trả về đầy đủ thông tin event bao gồm: event_id, title, description, organization, status, created_by, created_at, updated_at.
- **Rationale**: Spec FR-003 yêu cầu hiển thị thông tin người tạo (created_by).

## 4. 404 Handling

- **Decision**: Nếu event ID không tồn tại → throw ServiceError 404.
- **Pattern**: Giống các module khác.

## 5. Cross-module Integration với UC09

- **Decision**: Mở rộng file `event.service.js` đã có từ UC67 — thêm hàm `getEventById`. File `event.routes.js` đã có từ UC67 — thêm route `GET /:id`.
- **Rationale**: UC09 (NamLD) sẽ dùng chung endpoint này. Cần đảm bảo tương thích.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Endpoint | GET /api/v1/events/:id (tái sử dụng UC09) | Context A1 |
| Role-based visibility | Manager/Admin → PENDING allowed; Staff/Volunteer → 403 | Spec FR-004 |
| Response | Full event info + created_by | Spec FR-003 |
| 404 handling | Service check → throw 404 | Chuẩn VMS |
| Cross-module | Mở rộng file UC67, dùng chung với UC09 | Tránh duplicate |