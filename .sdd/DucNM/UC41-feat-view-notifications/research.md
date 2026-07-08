# Research: View Notifications (UC41)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-08

---

## 1. Notification Model

- **Decision**: Model Notification với các fields: `notification_id`, `user_id`, `title`, `message`, `type`, `reference_id`, `reference_type`, `is_read`, `created_at`, `updated_at`.
- **Rationale**:
  - `user_id`: FK → User — mỗi notification gắn với một user.
  - `type`: Phân loại: system, event_reminder, application_approved, application_rejected, certificate_issued.
  - `reference_id` + `reference_type`: Liên kết đến entity gốc (VD: event_id, application_id).
  - `is_read`: Boolean, mặc định false — đánh dấu đã đọc/chưa đọc.

## 2. Pagination

- **Decision**: Dùng Prisma `skip` + `take` pattern — page-based, mặc định limit = 20.
- **Rationale**: Spec A1 — 20 notification mỗi trang. Hỗ trợ phân trang dạng page/limit.
- **Pattern**: `[data, total] = await Promise.all([findMany({skip, take, where, orderBy}), count({where})])`

## 3. Sắp xếp

- **Decision**: `orderBy: { created_at: 'desc' }` — mới nhất trên cùng.
- **Rationale**: Spec FR-003.

## 4. Scope: User-Specific

- **Decision**: Luôn filter `where: { user_id: currentUser.user_id }` — user chỉ thấy notification của mình.
- **Rationale**: Spec: "Mỗi user chỉ thấy thông báo của chính mình."

## 5. Unread Count Endpoint

- **Decision**: Endpoint riêng `GET /api/v1/notifications/unread-count` — trả về `{ unread_count: number }`.
- **Rationale**: Spec A2 — Frontend polling mỗi 30 giây.
- **Pattern**: `prisma.notification.count({ where: { user_id, is_read: false } })`

## 6. Zod Schema

- **Decision**: Schema cho query params: page, limit.
- **Pattern**:
  ```js
  export const getNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  });
  ```

## 7. Route Order

- **Decision**: Route `/unread-count` phải đặt TRƯỚC route `/:id` để tránh Express coi "unread-count" là một ID.
- **Rationale**: Express route matching thứ tự — nếu `/:id` đặt trước thì "unread-count" sẽ bị match với `:id`.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Prisma model | notification_id, user_id, title, message, type, reference_id, reference_type, is_read | Spec |
| Pagination | Prisma skip/take, page/limit, default 20 | Spec A1 |
| Sorting | created_at DESC | Spec FR-003 |
| Scope | Filter by user_id from JWT | User chỉ thấy của mình |
| Unread count | Endpoint riêng /unread-count | Spec A2, polling |
| Route order | /unread-count before /:id | Express conflict prevention |