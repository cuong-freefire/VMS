# CONTEXT.md — View Pending Event (UC67)
# Người viết: DucNM (Member 5) | Ngày: 2026-06-30 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema — EventStatus: PENDING_APPROVAL (not "PENDING").

## 1. PROBLEM STATEMENT
Staff tạo sự kiện mới ở trạng thái DRAFT, sau đó submit lên trạng thái PENDING_APPROVAL. Manager cần xem danh sách các sự kiện đang chờ duyệt để phê duyệt hoặc từ chối.

## 2. DOMAIN KNOWLEDGE
- **Event Status Workflow**: DRAFT → PENDING_APPROVAL → PUBLISHED → IN_PROGRESS → COMPLETED
- **Visibility**: Chỉ sự kiện PUBLISHED mới hiển thị cho Volunteer.
- **Phân quyền**: Manager và Admin có quyền xem PENDING_APPROVAL events.
- **API**: `GET /api/v1/events?status=pending_approval` (query param, không có endpoint riêng).

## 3. CONSTRAINTS
- **Phân quyền**: Manager và Admin mới có quyền. Staff/Volunteer/Guest bị từ chối.
- **Status**: `PENDING_APPROVAL` (Prisma enum).

## 4. DECISIONS
- Dùng query param `status=pending_approval` trên endpoint `GET /api/v1/events`.
- Có phân trang (page, limit) mặc định limit = 20.