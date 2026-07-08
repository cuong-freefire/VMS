# API Contracts: Edit Category (UC33)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-01

---

## Overview

This directory contains the API contracts for the UC33 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-update-category.md](api-update-category.md) | `PATCH /api/v1/categories/:id` — Update category information |

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
| `NO_FIELDS_TO_UPDATE` | 400 | Empty request body |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `CATEGORY_NOT_FOUND` | 404 | Category ID does not exist |
| `CATEGORY_EXISTS` | 409 | Name already exists in the same type |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |