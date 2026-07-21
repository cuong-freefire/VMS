# CONTEXT.md — View Application Detail (UC23)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0.

## 1. PROBLEM STATEMENT
Staff cần xem thông tin chi tiết của một đơn đăng ký bao gồm hồ sơ cá nhân của tình nguyện viên để đánh giá mức độ phù hợp.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem chi tiết application của sự kiện do mình tạo.
- **Application Status**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- **API**: `GET /api/v1/applications/:applicationId`

## 3. CONSTRAINTS
- **Authorization**: Staff chỉ xem được application của event do mình tạo.
- **No status auto-change**: Viewing detail does NOT change application status (no "Reviewed" status exists).