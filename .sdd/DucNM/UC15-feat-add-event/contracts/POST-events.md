# API Contract: POST /api/v1/events

**Feature**: UC15 Add Event  
**Owner**: DucNM (Event Management Module)  
**Status**: REVIEWED  
**Version**: 2.0  
**Last Updated**: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, response.util.js, existing auth middleware

---

## Overview

Staff tạo sự kiện tình nguyện mới.

**Business Rules**:
- `createdBy` được lấy từ JWT token — KHÔNG tin request body
- `startDate` > current server time
- `endDate` > `startDate`
- `applicationDeadline` < `startDate`
- `categoryId` là bắt buộc
- `maxCapacity`: 1-10,000 người

---

## Endpoint

```
POST /api/v1/events
```

---

## Authentication

**Required**: ✅ Yes

**Method**: JWT HttpOnly Cookie (`token`)

**Authorization**: User role MUST be `STAFF`

---

## Request

### Headers

```http
Content-Type: application/json
Cookie: token=<jwt_token>
```

### Body Schema

```typescript
{
  title: string;              // Required, min 10 chars, max 500 chars
  description: string;        // Required, min 50 chars, max 5000 chars
  startDate: string;          // Required, ISO 8601 datetime, MUST > now
  endDate: string;            // Required, ISO 8601 datetime, MUST > startDate
  applicationDeadline: string;// Required, ISO 8601 datetime, MUST < startDate
  location: string;           // Required, max 500 chars
  maxCapacity: number;        // Required, integer, min 1, max 10000
  categoryId: number;         // Required, integer, FK -> event_categories.id
  imageUrl?: string;          // Optional, HTTPS URL from Cloudinary
}
```

### Example Request

```json
{
  "title": "Mùa Hè Xanh 2026 - Hà Giang",
  "description": "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc. Tình nguyện viên sẽ tham gia các hoạt động xây dựng trường học, dạy học cho trẻ em vùng cao và hỗ trợ cộng đồng địa phương.",
  "startDate": "2026-07-15T08:00:00.000Z",
  "endDate": "2026-07-20T17:00:00.000Z",
  "applicationDeadline": "2026-07-10T23:59:59.000Z",
  "location": "Hà Giang, Việt Nam",
  "maxCapacity": 50,
  "categoryId": 1,
  "imageUrl": "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg"
}
```

---

## Response

### Success Response

**Status Code**: `201 Created`

**Body Schema** (theo response.util.js):
```typescript
{
  success: true;
  message: string;
  data: {
    id: number;
    title: string;
    description: string;
    startDate: string;             // ISO 8601
    endDate: string;               // ISO 8601
    applicationDeadline: string;   // ISO 8601
    location: string;
    maxCapacity: number;
    approvedParticipants: number;
    imageUrl: string | null;
    categoryId: number;
    status: 'DRAFT';
    isActive: boolean;
    createdBy: number;             // Từ JWT token
    createdAt: string;             // ISO 8601
    updatedAt: string;             // ISO 8601
  }
}
```

**Example**:
```json
{
  "success": true,
  "message": "Tạo sự kiện thành công",
  "data": {
    "id": 123,
    "title": "Mùa Hè Xanh 2026 - Hà Giang",
    "description": "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc...",
    "startDate": "2026-07-15T08:00:00.000Z",
    "endDate": "2026-07-20T17:00:00.000Z",
    "applicationDeadline": "2026-07-10T23:59:59.000Z",
    "location": "Hà Giang, Việt Nam",
    "maxCapacity": 50,
    "approvedParticipants": 0,
    "imageUrl": "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg",
    "categoryId": 1,
    "status": "DRAFT",
    "isActive": true,
    "createdBy": 456,
    "createdAt": "2026-06-29T15:09:00.000Z",
    "updatedAt": "2026-06-29T15:09:00.000Z"
  }
}
```

---

## Error Responses

Tất cả error responses theo format `response.util.js`:
```typescript
{
  success: false;
  message: string;   // Human-readable error message
  code: string;      // Error code
  details: any;      // Optional details
}
```

### 400 Bad Request (Validation Error)

**Cause**: Request body không pass Zod validation

**Examples**:

```json
{
  "success": false,
  "message": "Start date must be in the future",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

```json
{
  "success": false,
  "message": "End date must be after start date",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

### 401 Unauthorized

**Cause**: JWT token missing, expired, hoặc invalid

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden

**Cause**: User không có role `STAFF`

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error",
  "code": "INTERNAL_SERVER_ERROR",
  "details": null
}
```

---

## Implementation Notes

### Security

1. **Identity Extraction** (Critical):
   - `createdBy` PHẢI lấy từ `req.user.user_id` (injected by JWT middleware)
   - TUYỆT ĐỐI KHÔNG trust request body cho identity fields

2. **Date Validation**:
   - Backend PHẢI validate lại với server time
   - Không trust client-provided timestamps

### Database

Sử dụng Prisma ORM để tạo event record. Không có transaction phức tạp cho create đơn thuần.

---

## Related Contracts

- **GET /api/v1/events**: List events (UC08, UC67)
- **GET /api/v1/events/:id**: Get event details (UC09, UC68)
- **PATCH /api/v1/events/:id**: Update event (UC16)
- **DELETE /api/v1/events/:id**: Soft delete event (UC17)

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2026-07-18 | Architect | Aligned with Prisma schema: removed organization_id, added categoryId, applicationDeadline, approvedParticipants. Fixed response format to match response.util.js. Fixed cookie name to 'token'. |
| 1.0 | 2026-06-29 | TienTD | Initial draft |

---

## References

- **Prisma Schema**: `backend/prisma/schema.prisma`
- **Response Format**: `backend/src/utils/response.util.js`
- **Auth Middleware**: `backend/src/middlewares/auth.middleware.js`