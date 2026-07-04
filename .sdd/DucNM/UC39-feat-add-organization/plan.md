# Triển khai kế hoạch: Add Organization (UC39)

**Branch**: `001-uc39-add-organization` | **Date**: 2026-07-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC39-feat-add-organization/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin cần thêm tổ chức mới vào hệ thống VMS để mở rộng danh sách đối tác. Backend xây dựng endpoint `POST /api/v1/organizations` với validation (name required + unique, contact_email format nếu có), hỗ trợ upload logo lên Cloudinary (max 2MB, .jpg/.png/.webp). Chỉ Admin mới có quyền; Manager/Staff/Volunteer bị 403, Guest bị 401. Kế thừa Organization infrastructure từ UC37 (model, repository pattern). Pattern tương tự Add User (UC28) và Add Category (UC32).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, bcryptjs, Pino logger, swagger-jsdoc + swagger-ui-express, Cloudinary (multer + cloudinary SDK)
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Organization model — đã có từ UC37, unique constraint trên name)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 2 giây (bao gồm thời gian upload logo lên Cloudinary nếu có)

**Constraints**: 
- Chỉ Admin mới có quyền tạo (Manager/Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- `name` là bắt buộc, unique — nếu trùng → HTTP 409 Conflict
- `contact_email` (nếu có) phải đúng email format
- Logo upload: max 2MB, chỉ .jpg/.png/.webp, upload lên Cloudinary
- Organization mặc định `is_active = true`
- Audit log sau khi tạo thành công
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Organization module (UC37). Kế thừa Organization model từ UC37. Thêm mới: validator schema, service function, controller handler, route, Cloudinary upload handling. Pattern tương tự Add User (UC28) và Add Category (UC32).

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Soft Delete**: Organization dùng `is_active = false`
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC39-feat-add-organization/
├── context.md              # Problem context
├── spec.md                 # Feature specification
├── plan.md                 # This file (/speckit-plan command output)
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
└── tasks.md                # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── organization.controller.js  # Thêm handler createOrganization (kế thừa UC37/UC38)
│   ├── services/
│   │   └── organization.service.js     # Thêm hàm createOrganization (kế thừa UC37/UC38)
│   ├── repositories/
│   │   └── organization.repository.js  # Thêm hàm createOrganization + findByName (kế thừa UC37/UC38)
│   ├── middleware/
│   │   ├── auth.middleware.js           # (đã có)
│   │   ├── authorize.middleware.js      # (từ UC26)
│   │   └── upload.middleware.js         # MỚI: multer config cho Cloudinary upload
│   ├── routes/
│   │   └── organization.routes.js      # Thêm route POST / (kế thừa UC37/UC38)
│   ├── validators/
│   │   └── organization.validator.js   # Thêm createOrganizationSchema (Zod)
│   ├── config/
│   │   └── cloudinary.config.js        # MỚI: Cloudinary config
│   └── tests/
│       └── organization/
│           ├── organization.service.test.js # Thêm tests cho createOrganization
│           └── organization.api.test.js     # Thêm tests cho POST /api/v1/organizations

frontend/
├── src/
│   ├── api/
│   │   └── organizationApi.js          # Thêm hàm createOrganization (kế thừa UC37/UC38)
│   ├── components/
│   │   └── pages/
│   │       └── AddOrganizationPage.jsx # MỚI: Add Organization form
│   ├── hooks/
│   │   └── useCreateOrganization.js   # MỚI: custom hook
│   └── App.js                          # Thêm route /organizations/add
```

**Structure Decision**: Option 2 (Web application). Kế thừa Organization infrastructure từ UC37/UC38. Thêm mới các hàm `createOrganization` ở các layer tương ứng + Cloudinary upload handling. Pattern tương tự Add User (UC28) và Add Category (UC32).

## Complexity Tracking

> **Không có vi phạm** — feature trung bình (1 endpoint POST với validation + unique check + Cloudinary upload), kế thừa infrastructure từ UC37/UC38.