# API Contracts: View Dashboard (UC54)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## Overview

This directory contains the API contracts for the UC54 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-dashboard-summary.md](api-dashboard-summary.md) | `GET /api/v1/dashboard/summary` — Get dashboard KPI metrics and chart data |

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
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |