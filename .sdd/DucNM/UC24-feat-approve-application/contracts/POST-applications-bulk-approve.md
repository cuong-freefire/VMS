# API Contract: Bulk Approve Applications

**Note**: This feature is **OUT OF SCOPE** for v1 (per CONTEXT.md decision: "Không có bulk approve trong v1").

**Status**: ❌ NOT IMPLEMENTED — This contract is a design artifact from the research phase. No code exists for this endpoint.

**Endpoint pattern (for future reference)**: `POST /api/v1/applications/bulk-approve`

**Prerequisites for implementation**:
1. email_queue table must exist in Prisma schema
2. Email worker must be implemented
3. Application.volunteer_id field must be added to Prisma schema (or use userId)

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: SUPERSEDED — Not implemented in v1