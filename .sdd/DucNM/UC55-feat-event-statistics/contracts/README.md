# API Contracts: Event Statistics (UC55)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Overview

This directory contains the API contracts for the UC55 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-event-stats.md](api-event-stats.md) | `GET /api/v1/dashboard/event-stats` — Get event statistics with time filter |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Required**: Yes
- **Authorization**: Only `ADMIN` and `MANAGER` roles are allowed

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
| `FORBIDDEN` | 403 | Insufficient permissions (not ADMIN/MANAGER) |
| `INVALID_DATE_RANGE` | 400 | start_date > end_date |
| `INVALID_DATE_FORMAT` | 400 | Invalid date format |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |