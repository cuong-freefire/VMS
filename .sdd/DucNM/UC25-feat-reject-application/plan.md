# Implementation Plan: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Status**: IMPLEMENTED

---

## Summary

Staff từ chối đơn đăng ký volunteer. Hệ thống:
1. Validate ownership (Staff chỉ reject application của event do mình tạo — `created_by`)
2. Update application status + timestamp + message (rejection reason) + processedBy
3. `message` field stores the rejection reason (no separate `rejection_reason` field)

## Implementation Status

✔️ Backend:
- `PATCH /api/v1/applications/:applicationId/reject` — implemented
- Zod validation cho applicationId path param (positive integer)
- Zod validation cho request body: `message` (required, min 10, max 2000 chars)
- Event creator ownership validation (created_by)
- Status validation (only PENDING → REJECTED)
- Swagger JSDoc documentation

❌ Email notification — NOT IMPLEMENTED (out of scope per CONTEXT.md)
❌ Bulk reject — NOT IMPLEMENTED (out of scope per CONTEXT.md)
❌ Audit logging — NOT IMPLEMENTED
❌ Frontend components — NOT IMPLEMENTED
❌ Integration tests — NOT IMPLEMENTED