# API Contracts: View Category List (UC31)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the UC31 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-categories.md](api-get-categories.md) | `GET /api/v1/categories` — Get all categories with role-based visibility |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Optional**: JWT HttpOnly Cookie
- **If authenticated**: Role-based visibility (Manager/Admin → all, Staff/Volunteer → active only)
- **If unauthenticated (Guest)**: Returns active categories only (public)

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
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |