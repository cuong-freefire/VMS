# Implementation Plan: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Status**: IMPLEMENTED

---

## Summary

Staff phê duyệt đơn đăng ký volunteer. Hệ thống:
1. Validate ownership (Staff chỉ approve application của event do mình tạo — `created_by`)
2. Check capacity (`approvedParticipants < maxCapacity`) — hard block, no buffer
3. Update application status + timestamp + processedBy
4. Increment event.approvedParticipants

## Implementation Status

✔️ Backend:
- `PATCH /api/v1/applications/:applicationId/approve` — implemented
- Zod validation cho applicationId path param (positive integer)
- Event creator ownership validation (created_by)
- Capacity hard block (409 Conflict if approvedParticipants >= maxCapacity)
- Status validation (only PENDING → APPROVED)
- Swagger JSDoc documentation

❌ Email notification — NOT IMPLEMENTED (out of scope per CONTEXT.md)
❌ Bulk approve — NOT IMPLEMENTED (out of scope per CONTEXT.md)
❌ Audit logging — NOT IMPLEMENTED
❌ Frontend components — NOT IMPLEMENTED
❌ Integration tests — NOT IMPLEMENTED