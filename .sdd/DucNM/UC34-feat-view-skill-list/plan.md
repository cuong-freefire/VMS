# Triển khai kế hoạch: View Skill List (UC34)

**Branch**: `001-uc34-view-skill-list` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC34-feat-view-skill-list/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin/Staff/Volunteer cần xem danh sách kỹ năng (Skill) để quản lý và tham chiếu. Backend xây dựng endpoint `GET /api/v1/skills`. Manager và Admin thấy tất cả skills (active + inactive). Staff và Volunteer chỉ thấy skills active. Guest bị từ chối (HTTP 401).

**⚠️ Cross-module dependencies**: UC34 phải phục vụ:
1. **UC11 (Filter Event — NamLD)**: Guest và Volunteer cần xem danh sách skill active để hiển thị dropdown filter trên Event List.
2. **UC20 (Edit Volunteer Skills — CuongLH)**: Volunteer cần xem danh sách skill active để chọn và gán kỹ năng cho profile của mình.

Theo spec UC34 gốc, Guest bị chặn (401). Cần mở rộng: **Guest được xem skills active qua public endpoint** (giống pattern UC31 với optionalAuth middleware) để phục vụ UC11.

Do đó:
- **Guest**: Xem skills active (public, optional auth) — phục vụ UC11
- **Volunteer**: Xem skills active — phục vụ UC11 + UC20 (Edit Volunteer Skills)
- **Staff**: Xem skills active
- **Manager/Admin**: Xem tất cả (active + inactive)

Không cần phân trang vì số lượng skill thường ít (< 50).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Skill model với soft delete qua is_active)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms — số lượng skill nhỏ, không cần phân trang

**Constraints**: 
- Manager/Admin: thấy tất cả skills (active + inactive)
- Staff: chỉ thấy skills active
- Volunteer: chỉ thấy skills active
- **Guest: chỉ thấy skills active, qua public endpoint (optional auth)** — phục vụ UC11 Filter Event
- Không cần phân trang (dữ liệu < 50 records)
- Soft delete: Skill dùng `is_active = false`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Skill Management (UC34-UC36). Thuộc Member 4 — AnhND. Tạo mới toàn bộ layers: controller, service, repository, routes, validator cho Skill. Pattern tương tự Category Management (UC31-UC33).

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Soft Delete**: Skill dùng `is_active = false`
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC34-feat-view-skill-list/
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
│   │   └── skill.controller.js    # MỚI: handler getSkills
│   ├── services/
│   │   └── skill.service.js       # MỚI: business logic — role-based visibility
│   ├── repositories/
│   │   └── skill.repository.js    # MỚI: Prisma queries
│   ├── middleware/
│   │   ├── auth.middleware.js      # (đã có)
│   │   ├── authorize.middleware.js # (từ UC26)
│   │   └── optionalAuth.middleware.js # (từ UC31) — tái sử dụng
│   ├── routes/
│   │   └── skill.routes.js        # MỚI: GET /api/v1/skills
│   ├── validators/
│   │   └── skill.validator.js     # MỚI: Zod schemas
│   ├── app.js                     # Cập nhật: mount skillRoutes
│   └── server.js                  # (đã có)
├── prisma/
│   └── schema.prisma              # MỚI: Skill model
└── tests/
    └── skill/
        ├── skill.service.test.js  # MỚI: unit tests
        └── skill.api.test.js      # MỚI: integration tests

frontend/
├── src/
│   ├── api/
│   │   └── skillApi.js            # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── SkillListPage.jsx  # MỚI: Skill List screen
│   ├── hooks/
│   │   └── useSkills.js           # MỚI: custom hook
│   └── App.js                     # Cập nhật: thêm route /skills
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Skill module. Pattern giống Category Management (UC31). Tái sử dụng `optionalAuth.middleware.js` từ UC31.

## Complexity Tracking

> **Không có vi phạm** — Skill Management module mới, pattern tương tự Category Management (UC31), tuân thủ cấu trúc phân tầng chuẩn VMS.