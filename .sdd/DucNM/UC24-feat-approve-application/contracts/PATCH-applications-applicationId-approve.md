# API Contract: Approve Single Application

**Endpoint**: `PATCH /api/v1/applications/:applicationId/approve`  
**Feature**: UC24 - Approve Application  
**Authentication**: Required (JWT HttpOnly cookie `token`)  
**Authorization**: Staff role + created_by ownership of Event

**Consistency Check**: Aligned with Prisma schema v3.0, response.util.js, AGENTS.md §3.1.

---

## Overview

Staff phê duyệt một đơn đăng ký volunteer. Hệ thống:
1. Validate ownership (Staff chỉ approve application của event do mình tạo)
2. Check capacity (`approvedParticipants < maxCapacity`)
3. Update application status + timestamp + processedBy
4. Increment event.approvedParticipants

---

## Request

### HTTP Method
`PATCH`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applicationId` | Integer | ✅ YES | Application ID to approve |

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Cookie` | String | ✅ YES | `token=<jwt>` |

### Request Body

**EMPTY** - No request body.

### Authorization Rules
1. ✅ Token must be valid
2. ✅ User role must be `STAFF`
3. ✅ Application's event MUST have `createdBy` matching Staff's `user_id`
4. ❌ If ownership mismatch → 403 Forbidden

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "id": 1,
    "userId": 5,
    "eventId": 10,
    "status": "APPROVED",
    "processedBy": 3,
    "processedAt": "2026-07-18T10:00:00.000Z",
    "createdAt": "2026-07-20T08:30:00.000Z",
    "updatedAt": "2026-07-18T10:00:00.000Z"
  }
}
```

### Error Responses (theo response.util.js)

#### 400 Bad Request - Invalid State Transition
```json
{
  "success": false,
  "message": "Cannot approve application in REJECTED state",
  "code": "INVALID_STATE_TRANSITION",
  "details": null
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": null
}
```

#### 409 Conflict - Capacity Full
```json
{
  "success": false,
  "message": "Event is at full capacity. Cannot approve more applications.",
  "code": "CAPACITY_EXCEEDED",
  "details": null
}
```

#### 409 Conflict - Already Processed
```json
{
  "success": false,
  "message": "Application is already APPROVED or REJECTED",
  "code": "INVALID_STATUS",
  "details": null
}
```

---

## Business Rules

### State Transition
- ✅ `PENDING` → `APPROVED`: Allowed
- ❌ `APPROVED` → `APPROVED`: 409 Conflict
- ❌ `REJECTED` → `APPROVED`: 409 Conflict
- ❌ `CANCELLED` → `APPROVED`: 409 Conflict

### Capacity Enforcement (CRITICAL)
| Condition | Action |
|-----------|--------|
| `approvedParticipants < maxCapacity` | Allow approval, increment approvedParticipants |
| `approvedParticipants >= maxCapacity` | **REJECT** with 409 Conflict |

No exceptions. No warnings. No over-capacity allowance.

---

**Contract Version**: 2.0  
**Last Updated**: 2026-07-18  
**Status**: REVIEWED