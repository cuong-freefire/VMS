# api-contract.md — Phase 1: API Contract for GET /api/v1/events/:id

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Author**: AI Agent (Member 1 - CuongLH context)

---

## API Contract: GET /api/v1/events/:id

View event detail — phục vụ cả Guest (không đăng nhập) và Volunteer (đã đăng nhập).

## 1. Endpoint

```
GET /api/v1/events/:id
```

| Attribute | Value |
|-----------|-------|
| **Method** | GET |
| **URL** | `/api/v1/events/:id` |
| **Auth** | Optional (Guest & Volunteer dùng chung endpoint) |
| **Rate Limit** | 100 req/min (Guest), 200 req/min (Volunteer) |

## 2. URL Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | integer | Yes | `> 0`, `≤ 2147483647` | Event ID (int32) |

## 3. Request Headers

### 3.1 Guest Request (Không bắt buộc)

```http
GET /api/v1/events/1 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Không cần Cookie header. Middleware `authenticateOptional` sẽ set `req.user = null`.

### 3.2 Volunteer Request (Có JWT Cookie)

```http
GET /api/v1/events/1 HTTP/1.1
Host: localhost:3000
Accept: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

Cookie `token` chứa JWT access token. Middleware `authenticateOptional` sẽ decode và validate session → `req.user = { user_id, email, role }`.

## 4. Response

### 4.1 Success Response (HTTP 200)

#### 4.1.1 Guest Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Dọn dẹp công viên Tao Đàn",
    "description": "<p>Tham gia dọn dẹp, trồng cây xanh tại công viên Tao Đàn.</p>",
    "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
    "startDate": "2026-08-15T08:00:00.000Z",
    "endDate": "2026-08-15T17:00:00.000Z",
    "applicationDeadline": "2026-08-10T23:59:59.000Z",
    "maxCapacity": 50,
    "approvedParticipants": 32,
    "remainingSlots": 18,
    "isFull": false,
    "imageUrl": "https://res.cloudinary.com/vms/image/upload/v123/event-banner.jpg",
    "status": "PUBLISHED",
    "createdAt": "2026-07-01T10:00:00.000Z",
    "updatedAt": "2026-07-10T15:30:00.000Z",
    "category": {
      "id": 3,
      "name": "Môi trường",
      "categoryType": "TYPE"
    },
    "createdBy": {
      "id": 5,
      "fullName": "Nguyễn Văn A",
      "avatarUrl": "https://res.cloudinary.com/vms/image/upload/v123/avatar.jpg"
    },
    "userApplication": null
  }
}
```

#### 4.1.2 Volunteer Response (Đã đăng nhập, chưa apply)

```json
{
  "success": true,
  "data": {
    "... (tất cả field giống Guest) ...",
    "userApplication": null
  }
}
```

#### 4.1.3 Volunteer Response (Đã apply, đang PENDING)

```json
{
  "success": true,
  "data": {
    "... (tất cả field giống Guest) ...",
    "userApplication": {
      "id": 42,
      "status": "PENDING",
      "createdAt": "2026-07-12T09:30:00.000Z"
    }
  }
}
```

#### 4.1.4 Volunteer Response (Đã apply, đã APPROVED)

```json
{
  "success": true,
  "data": {
    "... (tất cả field giống Guest) ...",
    "userApplication": {
      "id": 42,
      "status": "APPROVED",
      "createdAt": "2026-07-12T09:30:00.000Z"
    }
  }
}
```

#### 4.1.5 Volunteer Response (Đã apply, đã REJECTED)

```json
{
  "success": true,
  "data": {
    "... (tất cả field giống Guest) ...",
    "userApplication": {
      "id": 42,
      "status": "REJECTED",
      "createdAt": "2026-07-12T09:30:00.000Z"
    }
  }
}
```

#### 4.1.6 Volunteer Response (Đã apply, đã CANCELLED)

```json
{
  "success": true,
  "data": {
    "... (tất cả field giống Guest) ...",
    "userApplication": {
      "id": 42,
      "status": "CANCELLED",
      "createdAt": "2026-07-12T09:30:00.000Z"
    }
  }
}
```

### 4.2 Error Responses

#### 4.2.1 Event Not Found (HTTP 404)

Event không tồn tại, bị soft-delete, hoặc ở status không hiển thị.

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy sự kiện."
  }
}
```

**Các tình huống trả về 404**:

| Tình huống | Lý do |
|-----------|-------|
| `id` không tồn tại trong DB | Event ID chưa từng được tạo |
| `isActive = false` | Event bị soft-delete |
| `status = 'DRAFT'` | Event chưa hoàn thiện |
| `status = 'PENDING_APPROVAL'` | Đang chờ Manager duyệt |
| `status = 'REJECTED'` | Bị từ chối |
| `status = 'CANCELLED'` | Đã hủy |

> **Note**: Tất cả return 404 với cùng message để tránh information disclosure.

#### 4.2.2 Invalid Parameter (HTTP 400)

`id` không phải số nguyên hợp lệ.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ID sự kiện không hợp lệ.",
    "details": [
      {
        "field": "id",
        "message": "ID sự kiện phải là số nguyên dương"
      }
    ]
  }
}
```

#### 4.2.3 Internal Server Error (HTTP 500)

Lỗi không mong đợi (DB timeout, Prisma crash, ...).

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau."
  }
}
```

## 5. Response Fields Reference

### 5.1 EventDetailDTO

| Field | Type | Nullable | Computed | Description |
|-------|------|----------|----------|-------------|
| `id` | integer | No | No | Mã sự kiện |
| `title` | string | No | No | Tiêu đề sự kiện |
| `description` | string | Yes | No | Mô tả chi tiết (có thể null) |
| `location` | string | No | No | Địa điểm |
| `startDate` | string (ISO 8601) | No | No | Thời gian bắt đầu |
| `endDate` | string (ISO 8601) | No | No | Thời gian kết thúc |
| `applicationDeadline` | string (ISO 8601) | No | No | Hạn cuối đăng ký |
| `maxCapacity` | integer | No | No | Sức chứa tối đa |
| `approvedParticipants` | integer | No | No | Số TV đã duyệt (counter cache) |
| `remainingSlots` | integer | No | Yes | `maxCapacity - approvedParticipants` |
| `isFull` | boolean | No | Yes | `approvedParticipants >= maxCapacity` |
| `imageUrl` | string | Yes | No | URL ảnh bìa (Cloudinary) |
| `status` | string (enum) | No | No | `PUBLISHED` / `IN_PROGRESS` / `COMPLETED` |
| `createdAt` | string (ISO 8601) | No | No | Ngày tạo sự kiện |
| `updatedAt` | string (ISO 8601) | No | No | Ngày cập nhật cuối |
| `category` | object | Yes | No | Danh mục (null nếu categoryId null) |
| `category.id` | integer | No | No | Mã danh mục |
| `category.name` | string | No | No | Tên danh mục |
| `category.categoryType` | string (enum) | No | No | `LOCATION` / `TIME` / `TYPE` |
| `createdBy` | object | Yes | No | Người tạo (null nếu createdBy null) |
| `createdBy.id` | integer | No | No | Mã người tạo |
| `createdBy.fullName` | string | No | No | Họ tên |
| `createdBy.avatarUrl` | string | Yes | No | URL avatar |
| `userApplication` | object / null | Yes | Yes | Thông tin đơn của user hiện tại |

### 5.2 UserApplicationDTO

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Mã đơn |
| `status` | string (enum) | No | `PENDING` / `APPROVED` / `REJECTED` / `CANCELLED` |
| `createdAt` | string (ISO 8601) | No | Ngày nộp đơn |

## 6. Business Rules Embedded

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-1 | Chỉ hiển thị event có `isActive = true` | WHERE clause trong repository |
| BR-2 | Chỉ hiển thị event có `status IN ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED']` | WHERE clause trong repository |
| BR-3 | Guest không được thấy thông tin application của người khác | Chỉ query application với `userId` của chính user đang đăng nhập |
| BR-4 | Guest luôn có `userApplication: null` | Service layer: nếu `userId` là `null` → skip application query |
| BR-5 | Không expose `message`, `processedBy`, `processedAt` của Application | Select chỉ lấy `id`, `status`, `createdAt` |
| BR-6 | `remainingSlots` và `isFull` tính toán từ `maxCapacity` và `approvedParticipants` | Service layer: `remainingSlots = maxCapacity - approvedParticipants`, `isFull = approvedParticipants >= maxCapacity` |
| BR-7 | Tất cả tình huống không tìm thấy event đều trả về 404 | Tránh information disclosure (user enumeration) |

## 7. CORS & Security

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | Frontend origin (e.g., `http://localhost:3001`) |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Allow-Methods` | `GET, OPTIONS` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## 8. Testing Checklist

### 8.1 Integration Tests (Backend)

| Test Case | Method | Status Code | Condition |
|-----------|--------|------------|-----------|
| Guest xem event PUBLISHED | GET | 200 | `userApplication: null` |
| Guest xem event IN_PROGRESS | GET | 200 | `userApplication: null` |
| Guest xem event COMPLETED | GET | 200 | `userApplication: null` |
| Guest xem event DRAFT | GET | 404 | - |
| Guest xem event PENDING_APPROVAL | GET | 404 | - |
| Guest xem event REJECTED | GET | 404 | - |
| Guest xem event CANCELLED | GET | 404 | - |
| Guest xem event soft-deleted | GET | 404 | `isActive: false` |
| Guest xem event không tồn tại | GET | 404 | `id = 99999` |
| Guest xem với `id` = `"abc"` | GET | 400 | Validation error |
| Volunteer xem event (chưa apply) | GET | 200 | `userApplication: null` |
| Volunteer xem event (đã apply PENDING) | GET | 200 | `userApplication.status = 'PENDING'` |
| Volunteer xem event (đã apply APPROVED) | GET | 200 | `userApplication.status = 'APPROVED'` |
| Volunteer xem event (đã apply REJECTED) | GET | 200 | `userApplication.status = 'REJECTED'` |
| Volunteer xem event (đã apply CANCELLED) | GET | 200 | `userApplication.status = 'CANCELLED'` |
| Volunteer với token hết hạn | GET | 200 | Vẫn trả về Guest response (`userApplication: null`, không throw 401) |
| Volunteer với token invalid | GET | 200 | Vẫn trả về Guest response |
| Volunteer không có cookie | GET | 200 | Vẫn trả về Guest response |

> **Note**: Volunteer với token lỗi vẫn nhận được 200 (Guest response) — vì middleware `authenticateOptional` không throw 401. Đây là behavior mong đợi: endpoint vẫn public.

### 8.2 Unit Tests (Backend Service)

| Test Case | Expected |
|-----------|----------|
| `getEventDetail(1, null)` → Guest | EventDetailDTO với `userApplication: null` |
| `getEventDetail(1, 10)` → Volunteer chưa apply | EventDetailDTO với `userApplication: null` |
| `getEventDetail(1, 10)` → Volunteer đã apply | EventDetailDTO với `userApplication: { id, status, createdAt }` |
| `getEventDetail(1, null)` → Event có `approvedParticipants = 50`, `maxCapacity = 50` | `remainingSlots: 0`, `isFull: true` |
| `getEventDetail(1, null)` → Event có `approvedParticipants = 30`, `maxCapacity = 50` | `remainingSlots: 20`, `isFull: false` |

---

## END OF API-CONTRACT.MD