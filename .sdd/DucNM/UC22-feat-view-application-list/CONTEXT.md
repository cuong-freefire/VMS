# CONTEXT.md — View Application List (UC22)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0. ApplicationStatus: PENDING, APPROVED, REJECTED, CANCELLED.

## 1. PROBLEM STATEMENT
Staff cần xem danh sách các tình nguyện viên đã đăng ký tham gia sự kiện để bắt đầu quy trình sàng lọc và phê duyệt.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem danh sách application của sự kiện do mình tạo ra (`created_by`).
- **Application Status**: `PENDING` (mới đăng ký), `APPROVED` (đã duyệt), `REJECTED` (từ chối), `CANCELLED` (hủy).
- **Pagination**: Danh sách có phân trang, mặc định 20 items/trang.

## 3. CONSTRAINTS
- **Authorization**: Staff chỉ xem được application của event do mình tạo.
- **API**: `GET /api/v1/events/:eventId/applications` với query params `page`, `limit`, `status`.