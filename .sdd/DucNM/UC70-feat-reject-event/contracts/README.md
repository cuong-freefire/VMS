# API Contracts: Reject Event (UC70)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## Overview

This directory contains the API contracts for the UC70 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-reject-event.md](api-reject-event.md) | `PATCH /api/v1/events/:id/reject` — Reject a pending event with reason |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Required**: Yes
- **Authorization**: Only `MANAGER` and `ADMIN` roles are allowed

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

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions (not MANAGER/ADMIN) |
| `VALIDATION_ERROR` | 400 | Rejection reason is missing or too short |
| `EVENT_NOT_FOUND` | 404 | Event ID does not exist |
| `INVALID_STATUS` | 409 | Event is not in PENDING status |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |