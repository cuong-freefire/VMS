# API Contracts: Search Category

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the Search Category feature.

### Contracts

| File | Description |
|------|-------------|
| [api-search-categories.md](api-search-categories.md) | `GET /api/v1/categories` — Search categories by name or description |

### Base URL

All endpoints are prefixed with:

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie (optional)
- **Cookie name**: `token` (set by auth middleware)
- **Required for**: Manager, Staff, Volunteer
- **Guest access**: Active categories only (public — phục vụ UC11 Filter Event)

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
| `INVALID_TYPE` | 400 | Type parameter is invalid |