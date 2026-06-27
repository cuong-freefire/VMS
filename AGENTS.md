# Version: 4.0 | Updated: 2026-06-21 | Project: Volunteer Management System (VMS)

## 1. PROJECT OVERVIEW

Name: Volunteer Management System (VMS)
Type: Full-stack Web Application + REST API
Domain: Volunteer Management & Event Coordination

Vai trò: Bạn là một AI Agent đóng vai trò Kỹ sư phần mềm Senior trong dự án Volunteer Event Management System (VMS).
Mục tiêu chính: Xây dựng một nền tảng kết nối tổ chức với tình nguyện viên, giúp số hóa toàn trình quy trình sự kiện tình nguyện từ tìm kiếm, đăng ký tham gia, xét duyệt, điểm danh cho đến khâu đánh giá và cấp phát chứng nhận. Hệ thống phải phục vụ phân quyền rõ ràng cho 5 nhóm người dùng: Guest, Volunteer, Staff, Manager, và Admin.

Đọc trước:

1. `CLAUDE.md` — kiến trúc hệ thống, workflow, patterns, conventions
2. `CONSTITUTION.md` — development principles và team agreements
3. File này — quy tắc vận hành cụ thể cho agent

## 2. TECH STACK (STRICT — do not deviate)

Backend: NodeJS + Javascript
Frontend: React + jsx
Database: MySQL
Send Email: NodeMailer + Gmail service
Logging: pino + pino-http + pino-pretty
Swagger: swagger-jsdoc + swagger-ui-express
ORM: Prisma
File + image Storage: Cloudinary
Auth: JWT HttpOnly + Cookie + bcryptjs.
Testing: Jest + Supertest (cho Backend) và Jest + React Testing Library (cho Frontend)
Styling: Bootstrap CSS.

## 3. ARCHITECTURE PRINCIPLES

- **Layered Architecture:** Tuân thủ kiến trúc phân tầng: `Controller -> Service -> Repository`.
  - Tầng **Repository** là nơi duy nhất giao tiếp trực tiếp với Database thông qua Prisma Client.
  - Sử dụng trực tiếp các object do Prisma sinh ra để luân chuyển dữ liệu, **không** tạo thủ công các class Entity thuần túy.

- **Module Boundaries (Ranh giới Module):** Các module giao tiếp với nhau BẮT BUỘC phải thông qua tầng **Service** hoặc Route API. TUYỆT ĐỐI KHÔNG import chéo tầng Repository của module này vào module khác (Cross-module Repository Import) để tránh tạo ra sự phụ thuộc ngầm (hidden coupling).

- **API Style:** Thiết kế RESTful API và BẮT BUỘC sử dụng prefix `/api/v1/[resource]` cho tất cả các route.

- **Response & Error Handling:**
  - BẮT BUỘC sử dụng hàm dùng chung được định nghĩa tại `backend\src\utils\response.util.js` cho mọi HTTP response trả về client (bao gồm cả thành công và thất bại).
  - **Không** tự ý tạo format response mới bằng `res.json()` hay `res.send()` tại các Controller.
  - Xử lý lỗi (Exception handling) phải được quản lý tập trung và trả về đúng HTTP status codes thông qua hàm tiện ích này.

- **Database Access:** Toàn bộ truy xuất cơ sở dữ liệu phải đi qua Prisma ORM. Tuyệt đối không sử dụng raw SQL trong application code trừ khi có yêu cầu đặc biệt không thể giải quyết bằng Prisma.

- **Logging:** BẮT BUỘC sử dụng thư viện `Pino` cho mọi hoạt động logging trong dự án. Tuyệt đối **cấm** sử dụng `console.log`, `console.error` hay `console.info` trong production code.

- **Business Invariants (Bất biến nghiệp vụ VMS):** Các quy tắc cốt lõi của hệ thống tình nguyện viên như: giới hạn số lượng người tham gia sự kiện, quy trình duyệt đơn đăng ký (Pending -> Approved/Rejected), và điều kiện điểm danh/cấp chứng nhận là các điều kiện bắt buộc phải kiểm tra ở tầng Service, không phải là validation tùy chọn.

## 4. QUY CHUẨN ĐẶT TÊN (NAMING CONVENTIONS)

- **Backend Classes/Modules (Javascript):** PascalCase (ví dụ: `EventService.js`, `UserRepository.js`).
- **Frontend React Components (JSX):** PascalCase (ví dụ: `EventList.jsx`, `ApplicationTable.jsx`).
- **Utilities/Hooks (Javascript):** camelCase (ví dụ: `formatDate.js`, `useAuth.js`).
- **API Endpoints:** kebab-case để định danh các resource (ví dụ: `/api/v1/volunteer-events`, `/api/v1/feedback-forms`).
- **Database Tables (MySQL):** snake_case (ví dụ: `volunteer_applications`, `event_categories`). *Lưu ý: Trong Prisma schema, model name dùng PascalCase và map xuống bảng bằng `@@map("table_name")`*.
- **Specs:** Đặt theo cấu trúc `specs/[number]-[feature-name]/` hoặc chuẩn của dự án (ví dụ: `.sdd/specs/01-auth-login/SPEC.md`).

## 5. PHẠM VI HOẠT ĐỘNG

### Được phép

- Đọc và chỉnh sửa code trong các module Backend (NodeJS) và Frontend (React).
- Chạy các lệnh: `npm start`, `npm run dev`, `npm test` (Jest), `npx prisma ...`.
- Tạo branch mới theo pattern: `feat/*`, `fix/*`, `spec/*`, `chore/*`.

### Cấm tuyệt đối

    - KHÔNG được xóa thư mục `prisma/migrations` hoặc dữ liệu upload + seed trong `/uploads`, `/data`.
    - KHÔNG được commit trực tiếp vào nhánh `main` hoặc `Dev`.
    - KHÔNG được đọc hoặc ghi log ra console các file `.env`, `credentials`, `secrets`.
    - KHÔNG được bỏ qua input validation trên các API endpoints.
    - KHÔNG được duyệt đơn đăng ký tham gia (Approve Application) vượt quá số lượng tối đa cho phép của sự kiện.
    - KHÔNG được cấp phát chứng nhận (Generate Certificate) cho Tình nguyện viên không có dữ liệu điểm danh (Attendance).

## 6. FORBIDDEN PATTERNS

- **Bảo mật & Secrets:** TUYỆT ĐỐI KHÔNG lưu trữ mật khẩu, secret keys, hoặc API keys trong source code hoặc file `.env` được commit lên Git.
- **Xóa dữ liệu (Data Deletion):** TUYỆT ĐỐI KHÔNG xóa vật lý (hard-delete) bất kỳ bản ghi nào khỏi cơ sở dữ liệu. Bắt buộc phải sử dụng cơ chế xóa mềm (soft-delete) bằng cách cập nhật cờ `is_active: false`.
- **Kiểm tra đầu vào (Input Validation):** TUYỆT ĐỐI KHÔNG bỏ qua bước kiểm tra dữ liệu bằng `Zod` schema trên bất kỳ API write nào (POST/PUT/PATCH). Toàn bộ dữ liệu đầu vào phải được validate qua Zod trước khi truyền xuống tầng Service.
- **Phân quyền (Account & Role):** TUYỆT ĐỐI KHÔNG gán cứng (hardcode) role hoặc tự ý gán nhiều role khi tạo người dùng. Việc tạo tài khoản phải tuân thủ nghiêm ngặt theo đúng `role_id` duy nhất được cung cấp để map với bảng Role.

## 7. VMS DOMAIN RULES (QUY TẮC NGHIỆP VỤ LÕI)

### Event & Capacity rules (Sự kiện và Sức chứa)

1. Sức chứa sự kiện: `event.approved_participants <= event.max_capacity` luôn phải đúng trước và sau mọi thao tác duyệt đơn. TUYỆT ĐỐI KHÔNG duyệt đơn vượt quá số lượng cho phép.
2. Bất biến trạng thái: Không được phép chỉnh sửa thông tin cốt lõi của Sự kiện (Event) khi sự kiện đó đang diễn ra (`In Progress`) hoặc đã kết thúc (`Completed`).
3. Điều chỉnh tham gia: Tình nguyện viên chỉ có thể hủy đăng ký (Cancel Application) khi sự kiện chưa diễn ra. Đối với các trường hợp không tham gia khi sự kiện đã bắt đầu (no-show), TUYỆT ĐỐI KHÔNG dùng chức năng Hủy đơn, mà phải xử lý thông qua việc đánh vắng mặt ở chức năng Điểm danh (Attendance Check)

### Application rules (Quy tắc xét duyệt đơn)

1. Luồng trạng thái một chiều: Đơn đăng ký (Application) đã chuyển sang `Approved` (Đã duyệt) hoặc `Rejected` (Từ chối) thì TUYỆT ĐỐI KHÔNG được quay ngược lại trạng thái `Pending` (Chờ duyệt).
2. Điều kiện hợp lệ: Chỉ tình nguyện viên có account hợp lệ (`is_active: true`) mới được tạo Application.

### Attendance & Certificate rules (Điểm danh và Chứng nhận)

1. Ràng buộc điểm danh: Chỉ có thể điểm danh (Attendance Check) cho những tình nguyện viên có đơn đăng ký ở trạng thái `Approved`.
2. Điều kiện cấp chứng nhận: TUYỆT ĐỐI KHÔNG cấp phát chứng nhận (Generate Certificate) cho Tình nguyện viên không có dữ liệu điểm danh hợp lệ.
3. Tính duy nhất: Mỗi tình nguyện viên chỉ được cấp tối đa 1 chứng nhận cho mỗi sự kiện hoàn thành.

### Donation & Payment rules (Quyên góp và Thanh toán)

1. Tính bất biến của giao dịch (Immutability): Giao dịch quyên góp qua VNPay/MoMo sau khi ghi nhận trạng thái "Thành công" (`Success`) là dữ liệu bất biến. TUYỆT ĐỐI KHÔNG tự ý cập nhật/sửa đổi số tiền hoặc trạng thái của giao dịch này.
2. Rollback thanh toán: Các giao dịch lỗi hoặc timeout phải chuyển sang `Failed` hoặc `Cancelled`, không được kẹt vĩnh viễn ở trạng thái `Pending`.

### Soft delete rules (Quy tắc xóa dữ liệu)

1. Master data (User, Organization, Event, Category, Skill): BẮT BUỘC dùng xóa mềm bằng cờ `is_active = false`.
2. Transaction data (Application, Donation, Feedback): Không xóa vật lý dữ liệu nghiệp vụ, thay vào đó sử dụng chuyển trạng thái (`status = cancelled` hoặc `status = rejected`).

## 8. CODE & QUALITY RULES (QUY TẮC CODE & CHẤT LƯỢNG)

- **NodeJS (Backend):** Tuân thủ conventions của hệ sinh thái Javascript/NodeJS; bắt buộc sử dụng `async/await` cho các xử lý bất đồng bộ (tránh callback hell), và ném lỗi (throw error) rõ ràng để middleware xử lý tập trung.
- **React (Frontend):** Vì dự án sử dụng Javascript/JSX (không có TypeScript), BẮT BUỘC phải dùng `PropTypes` (hoặc cơ chế validate tương đương) để kiểm tra chặt chẽ các props truyền vào components. Không sử dụng biến global hoặc `var`, ưu tiên `const` và `let`.
- **Kích thước file & hàm:** Max function length: 40 dòng khi khả thi; max file length: 300 dòng (Tuân thủ theo chuẩn nguyên tắc chia nhỏ để dễ bảo trì).
- **Comments (Chú thích):** Comments chỉ dùng để giải thích TẠI SAO (why), TUYỆT ĐỐI KHÔNG giải thích ĐANG LÀM GÌ (what). Code phải tường minh + tự mô tả được logic của nó thông qua cách đặt tên biến và hàm.
- **Kiểm thử (Testing):** Test coverage tối thiểu bắt buộc là **80%** cho các logic nghiệp vụ (Service layer) và module mới. Sử dụng `Jest` cho cả Backend và Frontend.
- **Tài liệu API**  BẮT BUỘC cập nhật giao kèo vào shared_context.md (để đồng bộ team) VÀ viết đầy đủ comment cấu hình Swagger JSDoc (@swagger) ngay phía trên code của endpoint mỗi khi thêm mới hoặc chỉnh sửa. Các comment Swagger bắt buộc phải định nghĩa rõ Request Body, các mã Response lỗi (200, 400, 401, 403, 404, 500) và kèm theo ví dụ (example) cụ thể. Không có ngoại lệ.

## 9. XỬ LÝ LỖI & AN TOÀN THAO TÁC (ERROR HANDLING & SAFETY)

- **Clarification-First:** Nếu yêu cầu mơ hồ, thiếu domain context quan trọng hoặc có mâu thuẫn, AI **BẮT BUỘC phải hỏi lại (Clarification) thay vì tự đoán (No blind assumptions)**.
- **Kiểm tra tác động VMS Core:** Luôn kiểm tra tác động nghiệp vụ chéo trước khi sửa các luồng cốt lõi của VMS: *Quản lý Sự kiện (Event), Đăng ký (Application), Điểm danh (Attendance), Cấp Chứng nhận (Certificate) và Quyên góp (Donation)*.
- **Đọc ngữ cảnh đa tầng:** Trước các thay đổi có rủi ro cao, bắt buộc phải đọc chéo ngữ cảnh trong `CLAUDE.md`, `shared_context.md`, spec hiện hành (`SPEC.md`) và code của các module lân cận để đảm bảo không vi phạm ranh giới hệ thống + nghiệp vụ core.
- **Shadowing Plan cho rủi ro cao:** Với thao tác có thể phá hủy dữ liệu (VD: drop table, hard delete) hoặc thay đổi cấu trúc diện rộng (Schema migration, thay đổi API Contract dùng chung), AI **phải báo cáo Shadow Plan (Kế hoạch dự kiến) và chờ con người phê duyệt** trước khi chạy lệnh.
- **Phòng chống Loop Trap (Vòng lặp lỗi):** Trong quá trình tự sửa lỗi (tests fail, lint errors), nếu AI thử và thất bại quá 3 lần liên tiếp, **BẮT BUỘC phải DỪNG LẠI**, nêu rõ giới hạn/lỗi hiện tại và yêu cầu con người hỗ trợ thay vì tiếp tục tự fix mù quáng.
- **Fix the Spec, not the Code:** Nếu lỗi phát sinh do yêu cầu nghiệp vụ trong file Spec bị sai hoặc thiếu, AI phải báo cáo để con người cập nhật lại file Spec trước, TUYỆT ĐỐI không được tự sửa code đi lệch với Spec.

## 10. DEFINITION OF DONE (Tiêu chí hoàn thành cho mỗi task)

- [ ] Unit tests đã được viết và passing (Tối thiểu 80% coverage cho tầng Services).
- [ ] Integration tests cho tất cả API endpoints (Bắt buộc cover cả happy path + error paths).
- [ ] Không có lỗi linting/type errors (Chạy pass lệnh `npm run lint` hoặc `eslint`).
- [ ] API endpoint (thêm mới/chỉnh sửa) bắt buộc phải được document đầy đủ trong OpenAPI/Swagger.
- [ ] Các trường hợp lỗi (Error cases) ĐÃ ĐƯỢC handle với HTTP status codes chuẩn xác (VD: 400 Validation, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
- [ ] Đã ghi nhận Lịch sử thao tác (Audit log / History) cho các luồng thay đổi trạng thái quan trọng (VD: Staff duyệt/từ chối đơn UC24/UC25, Điểm danh UC45, Phát hành chứng nhận UC53).
- [ ] TUYỆT ĐỐI KHÔNG để lại comments dạng `TODO` hoặc `FIXME` trong code chuẩn bị merge.
- [ ] Các logic nghiệp vụ cốt lõi của VMS ĐÃ ĐƯỢC test nghiêm ngặt (VD: Ràng buộc không duyệt đơn vượt quá sức chứa `max_capacity`, chặn cấp chứng nhận nếu tình nguyện viên bị đánh vắng mặt).

## 11. GIT CONVENTIONS

### Branch naming

`feat/[feature-name]` — tính năng mới
`fix/[bug-name]` — sửa lỗi
`spec/[feature-name]` — viết spec
`chore/[short-name]` — cập nhật nhỏ

### Commit format

`[type]([scope]): [description]`

Example:
`feat(auth): implement volunteer login API`

### PR rules

- Min 1 approval before merge
- Max 400 lines changed; larger work should be split
- Never commit trực tiếp vào `main`/`Dev`

## 12. CURRENT SPRINT CONTEXT

<!-- Sprint: Sprint 1
Focus: Core Warehouse Operations — Inventory, Receipt, Issue, Transfer
Active specs: `specs/001-warehouse-management-system/spec.md`
Pending: Integration specs for Accounting/HRM/Sale APIs -->

## 13. PROJECT CONTEXT REFERENCES

- `CLAUDE.md` — hệ thống kiến trúc, workflow, lessons learned, anti-patterns
- `CONSTITUTION.md` — Architecture Principles & An toàn thao tác, Definition of Done (80% coverage & Integration tests), Prisma Client & Swagger JSDoc.
- `shared_context.md` — Multi-agent backbone, API contracts, shared data types & state synchronization

## 14. GITNEXUS INTEGRATION

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

### Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

### Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

### Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/VMS/context` | Codebase overview, check index freshness |
| `gitnexus://repo/VMS/clusters` | All functional areas |
| `gitnexus://repo/VMS/processes` | All execution flows |
| `gitnexus://repo/VMS/process/{name}` | Step-by-step execution trace |

### CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

Note: Nếu môi trường hiện tại không có GitNexus tooling, agent phải báo rõ không thể thực thi automation này trước khi tiếp tục các thay đổi thủ công.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **VMS** (209 symbols, 283 relationships, 4 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/VMS/context` | Codebase overview, check index freshness |
| `gitnexus://repo/VMS/clusters` | All functional areas |
| `gitnexus://repo/VMS/processes` | All execution flows |
| `gitnexus://repo/VMS/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
