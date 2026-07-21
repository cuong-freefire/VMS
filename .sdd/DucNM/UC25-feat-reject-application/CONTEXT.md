# CONTEXT.md — Reject Application (UC25)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

**Consistency Check**: Aligned with Prisma schema — Application has no `rejection_reason` field; use `message` field.

## 1. PROBLEM STATEMENT
Staff cần từ chối đơn đăng ký của tình nguyện viên không phù hợp.

## 2. DOMAIN KNOWLEDGE
- **Application Status**: `PENDING` → `REJECTED`.
- **Rejection Reason**: Lưu trong trường `message` của Application (không có `rejection_reason` riêng).
- **Authorization**: Staff chỉ từ chối application của event do mình tạo.

## 3. CONSTRAINTS
- **Status**: Chỉ reject application có status `PENDING`.
- **One-way**: Rejected → không thể quay lại PENDING.
- **API**: `PATCH /api/v1/applications/:applicationId/reject` với body `{ message: "lý do từ chối" }`.

## 4. DECISIONS
- Không có bulk reject trong v1.
- Sử dụng trường `message` để lưu lý do từ chối (Prisma schema không có `rejection_reason` trên Application).