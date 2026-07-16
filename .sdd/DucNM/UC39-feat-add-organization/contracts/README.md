# API Contracts: Add Organization (UC39)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Overview

This directory contains the API contracts for the UC39 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-create-organization.md](api-create-organization.md) | `POST /api/v1/organizations` — Create a new organization |

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
  "details": null | [...]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions (not ADMIN/MANAGER) |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds 2MB limit |
| `INVALID_FILE_FORMAT` | 400 | Uploaded file is not .jpg/.png/.webp |
| `ORGANIZATION_EXISTS` | 409 | Organization name already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |