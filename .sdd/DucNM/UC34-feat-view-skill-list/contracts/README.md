# API Contracts: View Skill List (UC34)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Overview

This directory contains the API contracts for the UC34 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-get-skills.md](api-get-skills.md) | `GET /api/v1/skills` — Get all skills with role-based visibility |

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

- **Optional**: JWT HttpOnly Cookie
- **If authenticated**: Role-based visibility (Manager/Admin → all, Staff/Volunteer → active only)
- **If unauthenticated (Guest)**: Returns active skills only (public) — phục vụ UC11 Filter Event

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