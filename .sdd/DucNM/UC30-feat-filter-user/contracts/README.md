# API Contracts: Filter User (UC30)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

UC30 extends the existing `GET /api/v1/users` endpoint (from UC26) with additional query parameters for filtering.

### Contract

| File | Description |
|------|-------------|
| [api-get-users-filter.md](api-get-users-filter.md) | `GET /api/v1/users` — Extended with filter query params |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Required**: Yes
- **Authorization**: Only `ADMIN` role

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null | [...]
}
```

### Error Codes (UC30 additions)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_DATE_FORMAT` | 400 | Date param not in YYYY-MM-DD format |
| `INVALID_DATE_RANGE` | 400 | from_date > to_date |
| `INVALID_IS_ACTIVE` | 400 | is_active not a valid boolean |