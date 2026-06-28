# CONSTITUTION — Nguyên tắc cốt lõi dự án VMS v4.0

## 1. Quy trình Spec-Driven Development (SDD) 5 pha

### Tổng quan quy trình

Mọi tính năng BẮT BUỘC phải đi qua các pha sau:

1. **Pha 0 — Context**: Human viết `CONTEXT.md` với problem, domain, stakeholders, constraints, assumptions và open questions.
2. **Pha 1 — Spec**: Human viết `SPEC.md` đủ 8 phần, dùng EARS notation và chỉ chuyển tiếp khi đã được review/approve. **Nếu có API changes, phải có API documentation (endpoint, method, request/response, auth) trong Spec và cập nhật `share_context.md` TRƯỚC KHI code.**
3. **Pha 2 — Plan**: AI đọc `SPEC.md` để tạo `PLAN.md`; chỉ lập kế hoạch, không viết code. Con người phê duyệt.
4. **Pha 3 — Tasks**: AI đọc `PLAN.md` và `SPEC.md` để tạo `TASKS.md` dạng bảng task atomic, independent, verifiable.
5. **Pha 4 — Implementation**: AI/code agent implement theo `TASKS.md`, mỗi task phải có done criteria rõ ràng.

**Trước mọi pha**: AI agent SHALL đọc `AGENTS.md` và `CLAUDE.md`.

### 1.1. Chuẩn `CONTEXT.md`

Mỗi feature context phải có đúng **6 phần**:

1. **PROBLEM STATEMENT**: Vấn đề cần giải quyết và tại sao cần feature này
2. **DOMAIN KNOWLEDGE**: Kiến thức nghiệp vụ liên quan (business rules, workflows)
3. **STAKEHOLDERS**: Ai sẽ sử dụng và được lợi từ feature này
4. **CONSTRAINTS**: Các giới hạn kỹ thuật, thời gian, ngân sách
5. **ASSUMPTIONS**: Các giả định về hệ thống, data, người dùng
6. **OPEN QUESTIONS**: Các câu hỏi chưa trả lời cần làm rõ trước khi spec

### 1.2. Chuẩn `SPEC.md`

Mỗi feature spec phải có đúng **8 phần**:

1. **Context & Goal**: Bối cảnh và mục tiêu của feature
2. **Actors & Roles**: Các actors tham gia và vai trò của họ (Guest, Volunteer, Staff, Manager, Admin)
3. **Functional Requirements (EARS Notation)**: Yêu cầu chức năng dùng EARS:
   - `THE <system> SHALL <action>`
   - `WHEN <condition>, THE <system> SHALL <action>`
   - `WHILE <state>, THE <system> SHALL <action>`
   - `WHERE <feature>, THE <system> SHALL <action>`
4. **Non-functional Requirements**: Performance, security, usability, scalability
5. **Data Model**: Entities, relationships, attributes liên quan
6. **Error Handling**: Các trường hợp lỗi và cách xử lý
7. **Acceptance Criteria (Given-When-Then)**: Tiêu chí chấp nhận theo BDD format
8. **Out of Scope**: Rõ ràng những gì KHÔNG nằm trong scope của feature này

### 1.3. Chuẩn `PLAN.md`

Mỗi implementation plan phải có đúng **6 phần**:

1. **ARCHITECTURAL APPROACH**: High-level approach, design patterns, trade-offs
2. **COMPONENTS**: Danh sách components/modules cần tạo/sửa (controllers, services, repositories, routes, middlewares)
3. **DATA FLOW**: Sequence diagrams hoặc mô tả flow từ request → response
4. **DEPENDENCIES**: External/internal dependencies, thứ tự thực hiện
5. **RISKS & MITIGATIONS**: Potential risks và cách giảm thiểu
6. **QUESTIONS FOR HUMAN**: Các quyết định cần con người xác nhận

### 1.4. Chuẩn `TASKS.md`

`TASKS.md` phải là **bảng Markdown** với 7 cột:

| ID | Task | Files | Est | Deps | Spec Refs | Done When |
| --- | --- | --- | --- | --- | --- | --- |

**Quy tắc task:**

- **ID**: Dùng `T001`, `T002`, ... theo thứ tự
- **Task name**: Bắt đầu bằng động từ và danh từ rõ ràng (Create, Implement, Write, Update)
- **Est**: Mỗi task tối đa 4 giờ; task lớn hơn phải chia nhỏ
- **Deps**: Dependency rõ ràng (T001, T002) hoặc `-` nếu independent
- **Spec Refs**: Trỏ về section/requirement trong `SPEC.md` (dùng §3.1, §5, etc.)
- **Done When**: Criteria kiểm chứng được bằng test, migration, response contract hoặc tài liệu cụ thể

**Nguyên tắc taskflow:**

- Tasks phải atomic (không thể chia nhỏ hơn mà vẫn có value)
- Tasks phải independent (có thể làm song song nếu không có deps)
- Tasks phải verifiable (done criteria đo lường được)

## 2. Hệ thống ràng buộc (Constraint Layers)

### Layer 1 (Hard Rules) — KHÔNG BAO GIỜ vi phạm

Vi phạm = **Critical security/data integrity issue**. Không có exception.

- ❌ **KHÔNG lưu password plaintext**: SHALL hash bằng bcrypt/argon2id.
- ❌ **KHÔNG SQL Injection**: SHALL dùng parameterized queries hoặc ORM (Prisma).
- ❌ **KHÔNG hard delete dữ liệu**: SHALL soft delete cho master data. **Chi tiết xem ADR-005 tại `CLAUDE.md` Section 3.**
- ❌ **KHÔNG leak credentials trong response**: Error SHALL NOT chứa password, JWT secret, API keys, database credentials, stack trace.
- ❌ **KHÔNG lấy userId từ request body**: SHALL lấy từ JWT token. **Chi tiết xem ADR-002 và Lesson 3 tại `CLAUDE.md`.**
- ❌ **KHÔNG commit secrets vào Git**: `.env`, private keys SHALL nằm trong `.gitignore`.
- ❌ **KHÔNG lưu trữ thông tin thẻ/tài khoản ngân hàng**: Mọi giao dịch thanh toán (VNPay, MoMo) SHALL được thực hiện qua Redirect hoặc Iframe của Gateway. Hệ thống CHỈ lưu transaction ID và status.
- **Input validation**: SHALL validate mọi request input bằng Zod. **Chi tiết xem ADR-003 tại `CLAUDE.md`.**
- **Authentication**: Protected routes SHALL verify JWT token qua `authMiddleware.authenticate`.
- **File Upload**: Upload phải validate kích thước (Max 5MB), định dạng (image/jpeg, image/png), và SHALL upload lên Cloudinary.

**Escalation**: Nếu AI Agent phát hiện vi phạm Layer 1, SHALL báo ngay lập tức.

### Layer 2 (Architecture Constraints) — Cần approval để thay đổi

Vi phạm = **Technical debt** hoặc **architectural inconsistency**.

- **Layered Architecture**: SHALL tuân thủ Controller → Service → Repository. **Chi tiết xem `CLAUDE.md` Section 3 (ADR-001) và Section 5 (Anti-Patterns).**
- **Cross-module access**: Module A SHALL NOT query trực tiếp bảng của Module B. SHALL gọi qua public service/adapter.
- **Module Ownership**: Agent SHALL NOT thay đổi logic bên trong folder/module của thành viên khác trừ khi:
  1. Có sự xác nhận của chủ sở hữu module
  2. Thay đổi được định nghĩa rõ trong Swagger documentation
- **Database transactions**: Transactions SHALL begin/commit/rollback ở service layer.
- **Audit Log**: System SHALL log mọi CUD operation trên critical entities: `applications`, `events`, `users`, `donations`, `certificates`.
  - Format: `{ who: user_id, when: timestamp, what: action, entity_type, entity_id, old_value, new_value, ip_address }`
  - SHALL NOT log: password, JWT token, credit card, sensitive PII

**Escalation**: Nếu AI Agent muốn vi phạm Layer 2, SHALL raise question trong `PLAN.md` Section 6.

### Layer 3 (Engineering Standards) — Có thể điều chỉnh

Vi phạm = **Code quality issue**. Có thể linh hoạt nếu có lý do documented.

- **Test coverage**: Target 80% cho services, 60% cho controllers.
- **Performance**: API response time target < 200ms (p95) với 100 concurrent requests.
- **Linting**: ESLint SHALL have 0 errors (warnings acceptable nếu có lý do documented).
- **Tests traceability**: Tests SHALL trace được về acceptance criteria trong `SPEC.md`.
- **API response format**: Tuân thủ chuẩn định dạng tại `CLAUDE.md` (ADR-006).

**Chi tiết checklist hoàn thành (Definition of Done) xem `AGENTS.md` Section 9.**

## 3. Quyền hạn AI Agent

### 3.1 AI Agent ĐƯỢC PHÉP tự động

✅ Đọc files trong project (trừ files bị .gitignore)  
✅ Tạo/sửa code files (controllers, services, repositories, routes, middlewares, utils)  
✅ Viết unit tests và integration tests  
✅ Chạy tests (`npm test`) và build (`npm run build`)  
✅ Tạo/cập nhật documentation (README, JSDoc, Swagger)  
✅ Refactor code không thay đổi behavior  
✅ Fix ESLint và formatting issues  

### 3.2 AI Agent PHẢI XIN PHÉP trước khi

❌ Xóa files (trừ `.tmp`, `.log`)  
❌ Apply database migrations (tạo file migration: OK, apply lên DB: CẦN PHÉP)  
❌ Merge vào `main`/`develop`/`master`  
❌ Deploy lên production/staging/UAT  
❌ Modify `.env`, `package.json`, `config/*.js`  
❌ `npm install` packages mới  
❌ Thay đổi architectural decisions (đổi ORM, framework, database type)  

### 3.3 Permission Request Format

```markdown
🚨 PERMISSION REQUIRED

Action: [Hành động cụ thể]
Reason: [Lý do]
Impact: [Files/data affected, breaking changes]
Rollback Plan: [Cách rollback]
Risk: [Low/Medium/High]
```

---

**Version**: 4.1  
**Last Updated**: 2026-06-25  
**Changelog**:

- v4.1: Bỏ Pha 1.5, gộp API documentation vào Pha 1
- v4.0: Tái cấu trúc theo bộ khung mới - tập trung vào Quy trình SDD, Constraint Layers và AI Agent Authority
- v4.0: Rút gọn để dễ đọc, loại bỏ các phần chi tiết kỹ thuật sang AGENTS.md và CLAUDE.md

*Tham chiếu: Xem Persona & Tech Stack tại `AGENTS.md`, Architecture & ADRs tại `CLAUDE.md`, API Contracts & Team Status tại `share_context.md`.*
