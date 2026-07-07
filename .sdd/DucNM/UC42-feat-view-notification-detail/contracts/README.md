# API Contracts: View Notification Detail (UC42)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Overview

This directory contains the API contracts for the UC42 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-notification-detail.md](api-get-notification-detail.md) | `GET /api/v1/notifications/:id` — Get notification detail with reference entity info |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Required**: Yes
- **Authorization**: All authenticated users (only owner can view)

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `INVALID_NOTIFICATION_ID` | 400 | Notification ID is not a valid positive integer |
| `NOTIFICATION_NOT_FOUND` | 404 | Notification does not exist or not owned by user |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |