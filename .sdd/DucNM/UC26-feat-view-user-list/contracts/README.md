# API Contracts: View User List (UC26)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the UC26 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-users.md](api-get-users.md) | `GET /api/v1/users` — List users with pagination, search, filter, sorting |

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
| `INVALID_PAGE` | 400 | Page parameter is invalid (negative, non-integer) |
| `INVALID_LIMIT` | 400 | Limit parameter is invalid (negative, > 100) |
| `INVALID_ROLE` | 400 | Role parameter is invalid |
| `INVALID_SORT` | 400 | Sort parameter format is invalid |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |