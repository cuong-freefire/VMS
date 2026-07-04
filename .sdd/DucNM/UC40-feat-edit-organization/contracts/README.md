# API Contracts: Edit Organization (UC40)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Overview

This directory contains the API contracts for the UC40 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-update-organization.md](api-update-organization.md) | `PUT /api/v1/organizations/:id` — Update organization information |

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
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds 2MB limit |
| `INVALID_FILE_FORMAT` | 400 | Uploaded file is not .jpg/.png/.webp |
| `ALREADY_INACTIVE` | 400 | Organization is already inactive |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization ID does not exist |
| `ORGANIZATION_EXISTS` | 409 | Organization name already exists |
| `ACTIVE_EVENTS_EXIST` | 409 | Cannot deactivate — active events exist |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |