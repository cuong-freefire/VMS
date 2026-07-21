# API Contracts: Search Skill

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Overview

This directory contains the API contracts for the Search Skill feature.

### Contracts

| File | Description |
|------|-------------|
| [api-search-skills.md](api-search-skills.md) | `GET /api/v1/skills` — Search skills by name or description |

### Base URL

All endpoints are prefixed with:

```
http://localhost:5000/api/v1
```

### Authentication

- **Method**: JWT HttpOnly Cookie
- **Cookie name**: `token` (set by auth middleware)
- **Required for**: All endpoints (Guest gets 401)
- **Authorization**: Manager/Admin sees all; Volunteer/Staff sees active only

### Standard Response Format

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "code": "ERROR_CODE",
  "details": null
}