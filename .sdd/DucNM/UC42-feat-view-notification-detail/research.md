# Research: View Notification Detail (UC42)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-08

---

## 1. Ownership Check

- **Decision**: Service kiểm tra `notification.user_id === currentUser.user_id`. Nếu không match → HTTP 404 (không lộ tồn tại).
- **Rationale**:
  - Spec FR-002: Chỉ user sở hữu mới được xem. Người khác → 404.
  - Dùng 404 thay vì 403 để không tiết lộ sự tồn tại của notification.

## 2. Auto Mark as Read

- **Decision**: Khi xem chi tiết, tự động set `is_read = true` (theo A1).
- **Rationale**: Spec A1 — gộp vào một request, không cần 2 bước.
- **Pattern**: Sau khi query notification thành công, update `is_read = true` trong cùng transaction hoặc sequential.

## 3. Reference Entity Lookup

- **Decision**: Dựa vào `reference_type` và `reference_id` để query entity tương ứng (Event, Application, Certificate).
- **Rationale**:
  - Spec FR-004: Trả về thông tin tóm tắt entity.
  - Nếu entity không tồn tại hoặc bị soft-delete → `reference_deleted: true`.
- **Pattern**: Switch case theo reference_type:
  - `event` → query Event model, lấy title, status
  - `application` → query Application model, lấy status
  - `certificate` → query Certificate model, lấy certificate_url
  - `null` → không có reference

## 4. Soft-Delete Detection

- **Decision**: Kiểm tra `is_active` của entity (nếu có field đó). Nếu entity không tồn tại hoặc `is_active = false` → `reference_deleted: true`.
- **Rationale**: Spec A2 — entity bị xóa mềm vẫn hiển thị notification nhưng không có link.

## 5. Response Structure

- **Decision**: Trả về notification detail + reference entity summary (nếu có).
- **Pattern**:
  ```json
  {
    "notification_id": 1,
    "title": "...",
    "message": "...",
    "type": "event_reminder",
    "is_read": true,
    "created_at": "...",
    "reference": {
      "type": "event",
      "id": 5,
      "summary": { "title": "Dọn dẹp bãi biển", "status": "APPROVED" },
      "deleted": false
    }
  }
  ```

## 6. Route Order

- **Decision**: Route `GET /:id` phải đặt SAU route `/unread-count` để tránh Express conflict.
- **Rationale**: Express match theo thứ tự — nếu `/:id` đặt trước, "unread-count" sẽ bị match với `:id`.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Ownership check | user_id match → 200, else → 404 | Spec FR-002 |
| Auto mark read | Set is_read = true on view | Spec A1 |
| Reference lookup | Query entity by type + id | Spec FR-004 |
| Soft-delete | Check is_active → deleted flag | Spec A2 |
| Response | Notification + reference summary | Spec FR-003/004 |
| Route order | /:id after /unread-count | Express conflict prevention |