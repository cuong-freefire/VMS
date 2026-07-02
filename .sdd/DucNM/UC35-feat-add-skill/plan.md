# Triển khai kế hoạch: Add Skill (UC35)

**Branch**: `001-uc35-add-skill` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC35-feat-add-skill/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin cần thêm mới kỹ năng (Skill) vào hệ thống — ví dụ: thêm "Photography" khi có nhu cầu mới. Backend xây dựng endpoint `POST /api/v1/skills` với validation (name required, unique trên toàn bảng). Chỉ Manager và Admin mới có quyền; Staff/Volunteer bị 403, Guest bị 401. Kế thừa Skill infrastructure từ UC34 (model, repository pattern). Pattern tương tự Add Category (UC32).

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

**Performance Goals**: Response < 1 giây cho request tạo skill hợp lệ

**Constraints**: 
- Chỉ Manager và Admin mới có quyền tạo (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Tên skill bắt buộc, unique trên toàn bảng — nếu trùng → HTTP 409 Conflict
- Skill mặc định `is_active = true`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Skill module (UC34). Kế thừa Skill model từ UC34. Thêm mới: validator schema, service function, controller handler, route. Pattern giống Add Category (UC32).

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC35-feat-add-skill/
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
│   │   └── skill.controller.js   # Thêm handler createSkill (kế thừa từ UC34)
│   ├── services/
│   │   └── skill.service.js      # Thêm hàm createSkill (kế thừa từ UC34)
│   ├── repositories/
│   │   └── skill.repository.js   # Thêm hàm createSkill + findByName (kế thừa từ UC34)
│   ├── middleware/                # (đã có)
│   ├── routes/
│   │   └── skill.routes.js       # Thêm route POST / (kế thừa từ UC34)
│   ├── validators/
│   │   └── skill.validator.js    # Thêm createSkillSchema (Zod)
│   └── tests/
│       └── skill/
│           ├── skill.service.test.js # Thêm tests cho createSkill
│           └── skill.api.test.js     # Thêm tests cho POST /api/v1/skills

frontend/
├── src/
│   ├── api/
│   │   └── skillApi.js           # Thêm hàm createSkill (kế thừa từ UC34)
│   ├── components/
│   │   └── pages/
│   │       └── AddSkillPage.jsx  # MỚI: Add Skill form
│   ├── hooks/
│   │   └── useCreateSkill.js     # MỚI: custom hook
│   └── App.js                    # Thêm route /skills/add
```

**Structure Decision**: Option 2 (Web application). Kế thừa Skill infrastructure từ UC34. Thêm mới các hàm `createSkill` ở các layer tương ứng. Pattern giống Add Category (UC32).

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint POST với validation + unique check), kế thừa infrastructure từ UC34.