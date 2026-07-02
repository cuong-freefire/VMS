# Triển khai kế hoạch: Edit Skill (UC36)

**Branch**: `001-uc36-edit-skill` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC36-feat-edit-skill/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin cần chỉnh sửa thông tin kỹ năng — cập nhật tên, mô tả, hoặc vô hiệu hóa skill (soft-delete) qua endpoint `PATCH /api/v1/skills/:id`. Backend validate dữ liệu bằng Zod, kiểm tra skill tồn tại (404 nếu không), kiểm tra tên unique khi đổi tên (409 nếu trùng). Chỉ Manager và Admin mới có quyền truy cập. Kế thừa Skill infrastructure từ UC34 và UC35. Pattern tương tự Edit Category (UC33).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Skill model — đã có từ UC34, unique constraint trên name)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây cho request chỉnh sửa hợp lệ

**Constraints**: 
- Chỉ Manager và Admin mới có quyền (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Các fields editable: `name`, `description`, `is_active`
- Tên mới phải unique — nếu trùng → HTTP 409
- Trả về HTTP 404 nếu skill ID không tồn tại
- Trả về HTTP 400 nếu request body rỗng
- Soft delete: `is_active = false`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Skill module (UC34 + UC35). Kế thừa toàn bộ infrastructure. Thêm mới: validator schema cho update, service function, controller handler, route PATCH. Pattern tương tự Edit Category (UC33).

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
.sdd/DucNM/UC36-feat-edit-skill/
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
│   │   └── skill.controller.js   # Thêm handler updateSkill (kế thừa UC34/UC35)
│   ├── services/
│   │   └── skill.service.js      # Thêm hàm updateSkillService (kế thừa)
│   ├── repositories/
│   │   └── skill.repository.js   # Thêm hàm updateSkill + findSkillById (kế thừa)
│   ├── middleware/                # (đã có)
│   ├── routes/
│   │   └── skill.routes.js       # Thêm route PATCH /:id (kế thừa UC34/UC35)
│   ├── validators/
│   │   └── skill.validator.js    # Thêm updateSkillSchema (Zod)
│   └── tests/
│       └── skill/
│           ├── skill.service.test.js # Thêm tests cho updateSkill
│           └── skill.api.test.js     # Thêm tests cho PATCH /api/v1/skills/:id

frontend/
├── src/
│   ├── api/
│   │   └── skillApi.js           # Thêm hàm updateSkill (kế thừa)
│   ├── components/
│   │   └── pages/
│   │       └── EditSkillPage.jsx # MỚI: Edit Skill form (kế thừa AddSkillPage)
│   ├── hooks/
│   │   └── useUpdateSkill.js     # MỚI: custom hook
│   └── App.js                    # Thêm route /skills/:id/edit
```

**Structure Decision**: Option 2 (Web application). Kế thừa Skill infrastructure từ UC34/UC35. Thêm mới các hàm `updateSkill` ở các layer tương ứng. Pattern tương tự Edit Category (UC33).

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint PATCH với validation + unique check), kế thừa infrastructure từ UC34/UC35.