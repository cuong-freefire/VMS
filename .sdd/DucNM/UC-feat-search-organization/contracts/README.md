# API Contracts: Search Organization

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the Search Organization feature.

### Contracts

| File | Description |
|------|-------------|
| [api-search-organizations.md](api-search-organizations.md) | `GET /api/v1/organizations` — Search organizations by name |

### Base URL

All endpoints are prefixed with:

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie (optional for public access)
- **Cookie name**: `token` (set by auth middleware)
- **Guest/Volunteer**: HTTP 401/403 Forbidden
- **Staff/Manager**: Active organizations only
- **Admin**: All organizations (active + inactive)

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null
}