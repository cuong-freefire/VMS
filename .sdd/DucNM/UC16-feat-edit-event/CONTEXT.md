# CONTEXT.md — Feature: Staff Module - Edit Event (UC16)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, AGENTS.md, architecture decisions.

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi tạo sự kiện (UC15), các thông tin thực tế có thể thay đổi (thời gian, địa điểm, số lượng tình nguyện viên cần thiết). Nếu không có chức năng chỉnh sửa, Staff phải xóa đi tạo lại, gây mất dữ liệu và gián đoạn quy trình đăng ký.
- **Business Value**: Đảm bảo thông tin sự kiện luôn chính xác và mới nhất, duy trì sự tin cậy của hệ thống.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền chỉnh sửa các sự kiện do mình tạo ra (`created_by`).
- **Event Lifecycle**: 
    - Sự kiện `DRAFT`: Có thể chỉnh sửa mọi trường.
    - Sự kiện `PENDING_APPROVAL`: Hạn chế chỉnh sửa.
    - Sự kiện `PUBLISHED`: Chỉ chỉnh sửa safe fields; critical fields đưa về PENDING_APPROVAL.
    - Sự kiện `IN_PROGRESS`/`COMPLETED`/`CANCELLED`: KHÔNG được chỉnh sửa.
- **Field Classification**:
  - **SAFE** (update directly): description, imageUrl
  - **CONDITIONAL** (validate before update): maxCapacity (>= approvedParticipants), applicationDeadline (> now, < startDate)
  - **CRITICAL** (reset status to PENDING_APPROVAL): title, location, startDate, endDate, categoryId
  - **READ ONLY** (never from client): id, approvedParticipants, createdBy, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectedReason, status, isActive, createdAt, updatedAt

## 3. CONSTRAINTS
- **Authorization**: Staff CHỈ được chỉnh sửa sự kiện do mình tạo ra (`created_by` từ JWT).
- **State Transition**: Không được chỉnh sửa sự kiện `IN_PROGRESS`/`COMPLETED`/`CANCELLED`.
- **Audit Trail**: Mọi thay đổi thông tin quan trọng phải được ghi log (`updatedAt` tự động cập nhật).