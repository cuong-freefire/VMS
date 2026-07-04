# API Contracts: View Pending Event Detail (UC68)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Overview

This directory contains the API contracts for the UC68 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-event-detail.md](api-get-event-detail.md) | `GET /api/v1/events/:id` — Get event detail with role-based visibility (reuses UC09 endpoint) |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles can view PENDING events

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
| `FORBIDDEN` | 403 | Insufficient permissions (not MANAGER/ADMIN for PENDING) |
| `INVALID_EVENT_ID` | 400 | Event ID is not a valid positive integer |
| `EVENT_NOT_FOUND` | 404 | Event ID does not exist |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |