# CONTEXT.md — Approve Application (UC24)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, AGENTS.md §3.1 (capacity rule).

## 1. PROBLEM STATEMENT
Staff cần phê duyệt đơn đăng ký của tình nguyện viên để họ chính thức tham gia sự kiện.

## 2. DOMAIN KNOWLEDGE
- **Application Status**: `PENDING` → `APPROVED`.
- **Capacity Rule**: `event.approvedParticipants <= event.maxCapacity`. TUYỆT ĐỐI KHÔNG duyệt vượt quá sức chứa.
- **Authorization**: Staff chỉ duyệt application của event do mình tạo.
- **API**: `PATCH /api/v1/applications/:applicationId/approve`

## 3. CONSTRAINTS
- **Capacity**: Trước khi approve, kiểm tra `approvedParticipants < maxCapacity`. Nếu vượt quá, trả về HTTP 409.
- **Status**: Chỉ approve application có status `PENDING`.
- **One-way**: Approved → không thể quay lại PENDING.

## 4. DECISIONS
- Không có bulk approve trong v1 (Out of Scope).
- Không có email thông báo trong v1 (sẽ tích hợp sau).