# API Contracts: Edit User (UC29)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the UC29 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-update-user.md](api-update-user.md) | `PATCH /api/v1/users/:id` — Update user information |

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
  "data": { ... },          // Present when success = true
  "code": "ERROR_CODE",     // Present when success = false
  "details": null | [...]    // Present when success = false (optional)
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions (not ADMIN) |
| `SELF_ROLE_DOWNGRADE` | 403 | Admin trying to downgrade own role |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `NO_FIELDS_TO_UPDATE` | 400 | Empty request body |
| `USER_NOT_FOUND` | 404 | User ID does not exist |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |