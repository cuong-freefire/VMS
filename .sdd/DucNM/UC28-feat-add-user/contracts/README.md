# API Contracts: Add User (UC28)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the UC28 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-create-user.md](api-create-user.md) | `POST /api/v1/users` — Create a new user |

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
| `VALIDATION_ERROR` | 400 | Request body validation failed (kèm details chi tiết từng field) |
| `EMAIL_EXISTS` | 409 | Email already exists in the system |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |