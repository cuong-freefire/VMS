# API Contracts: View Pending Event (UC67)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Overview

This directory contains the API contracts for the UC67 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-events.md](api-get-events.md) | `GET /api/v1/events` — Get events with status filter and role-based visibility |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Required**: Yes (JWT HttpOnly Cookie) for viewing PENDING events
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
| `INVALID_PAGE` | 400 | Page parameter is invalid |
| `INVALID_LIMIT` | 400 | Limit parameter is invalid (> 100) |
| `INVALID_STATUS` | 400 | Status parameter is invalid |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |