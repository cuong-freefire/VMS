# API Contracts: View Organization Detail (UC38)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Overview

This directory contains the API contracts for the UC38 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-organization-detail.md](api-get-organization-detail.md) | `GET /api/v1/organizations/:id` — Get organization detail with role-based visibility |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Optional**: JWT HttpOnly Cookie
- **If authenticated**: Role-based detail level + visibility
- **If unauthenticated (Guest)**: Returns basic info (name, description, logo_url, is_active) — phục vụ UC09

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
| `INVALID_ORGANIZATION_ID` | 400 | ID is not a valid positive integer |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization does not exist or no permission |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |