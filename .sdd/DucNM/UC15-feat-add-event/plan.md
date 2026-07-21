# Implementation Plan: Add Event (UC15)

**Branch**: `015-feat-add-event` | **Date**: 2026-06-29 | **Updated**: 2026-07-18
**Spec**: [SPEC.md](./SPEC.md)

**Consistency Check**: Aligned with Prisma schema v3.0, no Organization model.

---

## Summary

Staff cần khả năng tạo sự kiện tình nguyện mới với các thông tin cơ bản (title, description, dates, location, max capacity, category) để kêu gọi Volunteer tham gia.

**Technical Approach**: RESTful API endpoint `POST /api/v1/events` với Zod validation, Prisma ORM để lưu trữ, và JWT authentication để xác định Staff.

## Technical Context

**Storage**: MySQL database via Prisma ORM

**Constraints**: 
- Staff tạo event, `createdBy` được lấy từ JWT token
- Start date > current date
- Image upload giới hạn 5MB, formats: JPG/PNG only

## Constitution Check

- ✅ NO SQL injection (Prisma parameterized queries)
- ✅ NO hard delete (Soft delete với `isActive` flag)
- ✅ UserId from JWT (Lấy `createdBy` từ `req.user.user_id`)
- ✅ Input validation (Zod schema)
- ✅ Authentication (Protected route với `authMiddleware`)
- ✅ Layered Architecture: Controller → Service → Repository

---

## Phase 0: Research

### Q1: Làm sao validate Start Date > Current Date?
- **Finding**: Sử dụng Zod `.refine()` với Date comparison.
- **Decision**: Validate cả Frontend và Backend.

### Q2: Làm sao đảm bảo Staff chỉ tạo event cho chính mình?
- **Finding**: Extract `user_id` từ JWT token (`req.user.user_id`). Không có Organization model.
- **Decision**: Middleware `authMiddleware` inject `req.user`, Service lấy `createdBy` từ đó.

### Q3: Image upload workflow?
- **Finding**: Cloudinary upload đồng bộ (~1-2s).
- **Decision**: Frontend upload trước → get Cloudinary URL → submit form.

### Q4: Handle duplicate submission?
- **Decision**: Frontend disable button + loading state.

### Q5: Status field default?
- **Decision**: Default "DRAFT". Staff submit → PENDING_APPROVAL.

---

## Phase 1: Design

### 1. Data Model

Entity: Event — xem `data-model.md` và `backend/prisma/schema.prisma`

### 2. API Contract

**Endpoint**: `POST /api/v1/events`
**Authentication**: Required (JWT HttpOnly cookie `token`)
**Authorization**: User role MUST be `STAFF`

**Request Body**:
```json
{
  "title": "Mùa Hè Xanh 2026",
  "description": "Chiến dịch tình nguyện mùa hè...",
  "startDate": "2026-07-15T08:00:00.000Z",
  "endDate": "2026-07-20T17:00:00.000Z",
  "applicationDeadline": "2026-07-10T23:59:59.000Z",
  "location": "Hà Giang, Việt Nam",
  "maxCapacity": 50,
  "categoryId": 1,
  "imageUrl": "https://res.cloudinary.com/.../event-cover.jpg"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Tạo sự kiện thành công",
  "data": {
    "id": 123,
    "title": "Mùa Hè Xanh 2026",
    "status": "DRAFT",
    "createdBy": 456,
    "createdAt": "2026-06-29T14:52:00.000Z",
    "updatedAt": "2026-06-29T14:52:00.000Z"
  }
}
```

**Error Responses** (theo response.util.js):
```json
{
  "success": false,
  "message": "Validation failed: start_date must be in the future",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

### 3. Architecture Pattern

```
Frontend Request
  ↓
Express Route (event.routes.js)
  ↓
authMiddleware (validate JWT, inject req.user)
  ↓
Validation Middleware (Zod schema)
  ↓
Event Controller (HTTP layer)
  ↓
Event Service (Business logic)
  ↓
Event Repository (Prisma queries)
  ↓
MySQL Database
```

---

## Phase 2: Tasks

Xem `tasks.md` (sẽ được tạo sau).

---

**Version**: 2.0
**Last Updated**: 2026-07-18
**Status**: REVIEWED