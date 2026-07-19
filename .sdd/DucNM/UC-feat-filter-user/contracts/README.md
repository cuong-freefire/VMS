# API Contracts: Filter User

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the Filter User feature.

### Contracts

| File | Description |
|------|-------------|
| [api-filter-users.md](api-filter-users.md) | `GET /api/v1/users` — Filter users by role, active status, date range |

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
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null
}
```

### Error Codes (New for Filter User)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_DATE_FORMAT` | 400 | Date không đúng format YYYY-MM-DD |
| `INVALID_DATE_RANGE` | 400 | from_date > to_date |
| `INVALID_IS_ACTIVE` | 400 | is_active không phải boolean |