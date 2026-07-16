# API Contracts: View Notifications (UC41)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Overview

This directory contains the API contracts for the UC41 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-notifications.md](api-get-notifications.md) | `GET /api/v1/notifications` — Get notifications list with pagination |
| [api-unread-count.md](api-unread-count.md) | `GET /api/v1/notifications/unread-count` — Get unread notifications count |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Required**: Yes
- **Authorization**: All authenticated users (Volunteer, Staff, Manager, Admin)

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
| `INVALID_PAGE` | 400 | Page parameter is invalid |
| `INVALID_LIMIT` | 400 | Limit parameter is invalid (> 100) |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |