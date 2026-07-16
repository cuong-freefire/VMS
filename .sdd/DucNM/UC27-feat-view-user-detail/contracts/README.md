# API Contracts: View User Detail (UC27)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the UC27 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-user-detail.md](api-get-user-detail.md) | `GET /api/v1/users/:id` — Get user detail by ID |

### Base URL

All endpoints are prefixed with:

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Cookie name**: `token` (set by auth middleware)
- **Required for**: All endpoints
- **Authorization**: Only `ADMIN` role is allowed

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... }           // Present when success = true
  "code": "ERROR_CODE"      // Present when success = false
  "details": null            // Present when success = false (optional)
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions (not ADMIN) |
| `INVALID_USER_ID` | 400 | User ID is not a valid positive integer |
| `USER_NOT_FOUND` | 404 | User ID does not exist in database |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |