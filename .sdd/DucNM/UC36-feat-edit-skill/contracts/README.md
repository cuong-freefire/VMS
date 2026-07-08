# API Contracts: Edit Skill (UC36)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Overview

This directory contains the API contracts for the UC36 feature.

### Contracts

| File | Description |
|------|-------------|
| [api-update-skill.md](api-update-skill.md) | `PATCH /api/v1/skills/:id` — Update skill information |

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
| `SKILL_NOT_FOUND` | 404 | Skill ID does not exist |
| `SKILL_EXISTS` | 409 | Skill name already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |