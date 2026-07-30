# api-contract.md — Phase 1: API Contract for PATCH /api/v1/applications/:id/cancel

**Feature**: UC14-feat-cancel-application
**Date**: 2026-07-21
**Author**: AI Agent (CuongLH)

---

## API Contract: PATCH /api/v1/applications/:id/cancel

Volunteer hủy đơn đăng ký sự kiện đã nộp. Yêu cầu đăng nhập (Volunteer role).

## 1. Endpoint

```
PATCH /api/v1/applications/:id/cancel
```

| Attribute | Value |
|-----------|-------|
| **Method** | PATCH |
| **URL** | `/api/v1/applications/:id/cancel` |
| **Auth** | Required (Volunteer only) |
| **Rate Limit** | 20 req/min (tránh abuse) |

## 2. URL Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | integer | Yes | `> 0`, `≤ 2147483647` | Application ID (int32) |

## 3. Request Headers

```http
PATCH /api/v1/applications/42/cancel HTTP/1.1
Host: localhost:3000
Accept: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

Cookie `token` chứa JWT access token. Middleware `authMiddleware` sẽ decode → `req.user = { user_id, email, role, jti }`.

## 4. Request Body

**Không có request body** — PATCH endpoint chỉ dựa trên URL parameter và authenticated user từ JWT cookie.

## 5. Response

### 5.1 Success Response (HTTP 200)

```json
{
  "success": true,
  "message": "Đơn đăng ký đã được hủy thành công.",
  "data": {
    "id": 42,
    "userId": 10,
    "eventId": 1,
    "status": "CANCELLED",
    "message": "Tôi rất mong muốn được tham gia sự kiện này.",
    "createdAt": "2026-07-12T09:30:00.000Z",
    "updatedAt": "2026-07-21T14:00:00.000Z",
    "event": {
      "id": 1,
      "approvedParticipants": 31
    }
  }
}
```

**Lưu ý**: `event.approvedParticipants` chỉ giảm khi cancel application đang ở status `APPROVED`. Nếu cancel application `PENDING`, giá trị này không thay đổi.

### 5.2 Error Responses

#### 5.2.1 Unauthorized - Không đăng nhập (HTTP 401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Vui lòng đăng nhập để thực hiện thao tác này."
  }
}
```

#### 5.2.2 Forbidden - Không phải chủ đơn (HTTP 403)

Application tồn tại nhưng thuộc về user khác.

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Bạn không có quyền hủy đơn đăng ký này."
  }
}
```

#### 5.2.3 Not Found (HTTP 404)

Application không tồn tại.

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy đơn đăng ký."
  }
}
```

#### 5.2.4 Conflict - Trạng thái không hợp lệ (HTTP 409)

**a) Đơn đã bị REJECTED:**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Đơn đăng ký này đã bị từ chối, không thể hủy."
  }
}
```

**b) Đơn đã bị CANCELLED:**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Đơn đăng ký này đã được hủy trước đó."
  }
}
```

**c) Sự kiện đã bắt đầu:**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Sự kiện đã bắt đầu, không thể hủy đơn đăng ký."
  }
}
```

**d) Sự kiện đã kết thúc hoặc bị hủy:**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Sự kiện không còn khả dụng để hủy đơn đăng ký."
  }
}
```

#### 5.2.5 Validation Error - Invalid Parameter (HTTP 400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ID đơn đăng ký không hợp lệ.",
    "details": [
      {
        "field": "id",
        "message": "ID đơn đăng ký phải là số nguyên dương"
      }
    ]
  }
}
```

#### 5.2.6 Internal Server Error (HTTP 500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau."
  }
}
```

## 6. Response Fields Reference

### 6.1 CancelApplicationResponseDTO

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Application ID |
| `userId` | integer | No | Volunteer ID |
| `eventId` | integer | No | Event ID |
| `status` | string | No | Luôn là `"CANCELLED"` |
| `message` | string \| null | Yes | Lời nhắn gốc khi đăng ký |
| `createdAt` | string (ISO 8601) | No | Ngày nộp đơn |
| `updatedAt` | string (ISO 8601) | No | Ngày hủy đơn |
| `event` | object | No | Thông tin event liên quan |
| `event.id` | integer | No | Event ID |
| `event.approvedParticipants` | integer | No | Số lượng approved sau khi cancel |

## 7. Business Rules Embedded

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-1 | Chỉ Volunteer đã đăng nhập mới được cancel | `authMiddleware` — bắt buộc JWT |
| BR-2 | Chỉ chủ đơn mới được cancel | Service: `application.userId === req.user.user_id` |
| BR-3 | Chỉ cancel được application ở status PENDING hoặc APPROVED | Service: check `status IN ['PENDING', 'APPROVED']` |
| BR-4 | Không cancel được khi sự kiện đã bắt đầu | Service: `event.startDate > new Date()` |
| BR-5 | Không cancel được event đã kết thúc hoặc bị hủy | Service: `event.status IN ['PUBLISHED', 'IN_PROGRESS']` |
| BR-6 | Khi cancel APPROVED → giảm `approvedParticipants` đi 1 | Repository: `$transaction` atomic decrement |
| BR-7 | Không thể quay lại PENDING sau khi CANCELLED | State machine: CANCELLED là terminal state |
| BR-8 | `approvedParticipants` không được giảm xuống dưới 0 | Service: guard check trước khi decrement |

## 8. CORS & Security

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | Frontend origin (e.g., `http://localhost:3001`) |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Allow-Methods` | `PATCH, OPTIONS` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## 9. Testing Checklist

### 9.1 Integration Tests (Backend)

| # | Test Case | Method | Status Code | Condition |
|---|-----------|--------|------------|-----------|
| 1 | Volunteer cancel PENDING application | PATCH | 200 | `status: CANCELLED`, `approvedParticipants` unchanged |
| 2 | Volunteer cancel APPROVED application | PATCH | 200 | `status: CANCELLED`, `approvedParticipants` giảm 1 |
| 3 | Không đăng nhập | PATCH | 401 | Không có cookie token |
| 4 | Token hết hạn | PATCH | 401 | JWT expired |
| 5 | User khác cancel application của người khác | PATCH | 403 | `userId` không khớp |
| 6 | Application không tồn tại | PATCH | 404 | `id = 99999` |
| 7 | `id` = `"abc"` | PATCH | 400 | Validation error |
| 8 | Cancel application REJECTED | PATCH | 409 | `status = REJECTED` |
| 9 | Cancel application đã CANCELLED | PATCH | 409 | `status = CANCELLED` |
| 10 | Cancel khi event đã bắt đầu | PATCH | 409 | `event.startDate < now` |
| 11 | Cancel khi event COMPLETED | PATCH | 409 | `event.status = COMPLETED` |
| 12 | Cancel khi event CANCELLED | PATCH | 409 | `event.status = CANCELLED` |
| 13 | Cancel khi event.isActive = false | PATCH | 409 | Soft-deleted event |

### 9.2 Unit Tests (Backend Service)

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | `cancelApplication(id, userId)` — PENDING, valid | Return CANCELLED application, no event change |
| 2 | `cancelApplication(id, userId)` — APPROVED, valid | Return CANCELLED application, `approvedParticipants` decremented |
| 3 | `cancelApplication(id, userId)` — application not found | Throw NOT_FOUND |
| 4 | `cancelApplication(id, userId)` — wrong userId | Throw FORBIDDEN |
| 5 | `cancelApplication(id, userId)` — REJECTED | Throw CONFLICT |
| 6 | `cancelApplication(id, userId)` — CANCELLED | Throw CONFLICT |
| 7 | `cancelApplication(id, userId)` — event started | Throw CONFLICT |
| 8 | `cancelApplication(id, userId)` — event completed | Throw CONFLICT |
| 9 | `cancelApplication(id, userId)` — approvedParticipants = 0 | Throw INTERNAL_ERROR |
| 10 | Transaction rollback khi approvedParticipants decrement fails | Application status unchanged |

---

## END OF API-CONTRACT.MD