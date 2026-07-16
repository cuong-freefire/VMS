# API Contracts: Search User

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the Search User feature.

### Contracts

| File | Description |
|------|-------------|
| [api-search-users.md](api-search-users.md) | `GET /api/v1/users` — Search users by name or email |

### Base URL

All endpoints are prefixed with:

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Cookie name**: `token` (set by auth middleware)
- **Required for**: All endpoints
- **Authorization**: Only `ADMIN` role is allowed

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null
}