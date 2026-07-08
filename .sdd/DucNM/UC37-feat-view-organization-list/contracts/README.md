# API Contracts: View Organization List (UC37)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Overview

This directory contains the API contracts for the UC37 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-organizations.md](api-get-organizations.md) | `GET /api/v1/organizations` — Get all organizations with role-based visibility |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Optional**: JWT HttpOnly Cookie
- **If authenticated**: Role-based visibility (Admin → all, Manager/Staff/Volunteer → active only)
- **If unauthenticated (Guest)**: Returns active organizations only (public) — phục vụ UC11 Filter Event

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
| `INVALID_PAGE` | 400 | Page parameter is invalid |
| `INVALID_LIMIT` | 400 | Limit parameter is invalid (> 100) |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |