# Triển khai kế hoạch: Edit Organization (UC40)

**Branch**: `001-uc40-edit-organization` | **Date**: 2026-07-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC40-feat-edit-organization/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin cần chỉnh sửa thông tin tổ chức — cập nhật tên, mô tả, địa chỉ, thông tin liên hệ, logo, hoặc vô hiệu hóa tổ chức (soft-delete) qua endpoint `PUT /api/v1/organizations/:id`. Backend validate dữ liệu (name unique trừ chính nó, email format), xóa logo cũ trên Cloudinary khi upload mới, kiểm tra ràng buộc sự kiện đang hoạt động trước khi soft-delete (409 nếu còn). Chỉ Manager và Admin mới có quyền. Kế thừa Organization infrastructure từ UC37/UC38/UC39.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express, Cloudinary (multer + cloudinary SDK)
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Organization model — đã có từ UC37, Event relation để kiểm tra active events)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 2 giây (bao gồm Cloudinary operations nếu có)

**Constraints**: 
- **Manager/Admin-only**: Chỉ Manager và Admin (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- **PUT method**: Gửi toàn bộ trường (kể cả không thay đổi)
- **Name unique**: Khi đổi tên, kiểm tra unique trừ chính nó — nếu trùng → HTTP 409
- **Contact_email**: Validate email format nếu có
- **Logo**: Upload mới → Cloudinary → xóa ảnh cũ trên Cloudinary
- **Soft-delete constraint**: Nếu set `is_active = false`, kiểm tra không còn event đang hoạt động (Pending/In Progress). Nếu còn → HTTP 409
- **Already inactive**: Nếu đã inactive, reject request set inactive lần nữa → HTTP 400
- **404**: Nếu ID không tồn tại
- **Audit log**: Ghi log sau khi update thành công
- **Swagger JSDoc** bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Organization module (UC37/UC38/UC39). Kế thừa toàn bộ infrastructure. Thêm mới: validator schema cho update, service function (với unique check + event constraint + Cloudinary delete), controller handler, route PUT.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Soft Delete**: Organization dùng `is_active = false` (ADR-005)
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC40-feat-edit-organization/
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
│   │   └── organization.controller.js  # Thêm handler updateOrganization (kế thừa UC37-39)
│   ├── services/
│   │   └── organization.service.js     # Thêm hàm updateOrganizationService (kế thừa UC37-39)
│   ├── repositories/
│   │   └── organization.repository.js  # Thêm hàm updateOrganization + countActiveEvents (kế thừa UC37-39)
│   ├── routes/
│   │   └── organization.routes.js      # Thêm route PUT /:id (kế thừa UC37-39)
│   ├── validators/
│   │   └── organization.validator.js   # Thêm updateOrganizationSchema (Zod)
│   └── tests/
│       └── organization/
│           ├── organization.service.test.js # Thêm tests cho updateOrganization
│           └── organization.api.test.js     # Thêm tests cho PUT /api/v1/organizations/:id

frontend/
├── src/
│   ├── api/
│   │   └── organizationApi.js          # Thêm hàm updateOrganization (kế thừa UC37-39)
│   ├── components/
│   │   └── pages/
│   │       └── EditOrganizationPage.jsx # MỚI: Edit Organization form (kế thừa AddOrganizationPage)
│   ├── hooks/
│   │   └── useUpdateOrganization.js    # MỚI: custom hook
│   └── App.js                          # Thêm route /organizations/:id/edit
```

**Structure Decision**: Option 2 (Web application). Kế thừa Organization infrastructure từ UC37/UC38/UC39. Thêm mới các hàm `updateOrganization` ở các layer tương ứng + active events constraint check. Pattern tương tự Edit Category (UC33) và Edit Skill (UC36) nhưng phức tạp hơn do Cloudinary operations và event constraint.

## Complexity Tracking

> **Không có vi phạm** — feature phức tạp trung bình (1 endpoint PUT với validation + unique check + Cloudinary delete + event constraint + audit log), kế thừa infrastructure từ UC37/UC38/UC39.