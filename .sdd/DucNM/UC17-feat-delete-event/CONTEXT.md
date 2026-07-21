# CONTEXT.md — Feature: Staff Module - Delete Event (UC17)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, AGENTS.md §3.5 (soft delete via isActive).

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Các sự kiện bị hủy hoặc tạo sai thông tin vẫn tồn tại trên hệ thống, làm loãng danh sách sự kiện.
- **Business Value**: Giúp hệ thống luôn duy trì dữ liệu chính xác.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xóa các sự kiện do mình tạo ra (`created_by`).
- **Event Lifecycle**: 
    - Sự kiện `DRAFT`: Có thể xóa.
    - Sự kiện `PUBLISHED`: Chỉ có thể xóa nếu chưa có Volunteer nào đăng ký (application count = 0).
    - Sự kiện `IN_PROGRESS`/`COMPLETED`: Không thể xóa.
- **Soft Delete**: Project sử dụng `isActive = false` (không phải `deleted_at`).

## 3. CONSTRAINTS
- **Authorization**: Staff CHỈ được xóa sự kiện do mình tạo ra.
- **Business Rule**: KHÔNG được xóa sự kiện đã có Volunteer đăng ký.
- **Soft Delete**: Chỉ set `isActive = false`, không hard delete.
- **State**: Không thể xóa sự kiện `IN_PROGRESS`/`COMPLETED`.

## 4. DECISIONS
- **Soft Delete**: Sử dụng `isActive = false` (theo project standard, AGENTS.md §3.5).
- **Confirmation**: Hiển thị Pop-up xác nhận "Bạn có chắc chắn muốn xóa?" thay vì bắt nhập lý do.