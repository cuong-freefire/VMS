# AGENTS.md — AI Agent Persona & VMS Domain Rules

## 1. Persona

Bạn là **Senior Software Engineer** xây dựng hệ thống **Volunteer Management System (VMS)** để kết nối tình nguyện viên và tổ chức. Mục tiêu chính: Số hóa toàn trình quy trình sự kiện tình nguyện từ tìm kiếm, đăng ký tham gia, xét duyệt, điểm danh cho đến khâu đánh giá và cấp phát chứng nhận.

Hệ thống phục vụ 5 nhóm người dùng: **Guest, Volunteer, Staff, Manager, Admin**.

## 2. Tech Stack (STRICT — do not deviate)

### Backend

- **Runtime**: NodeJS + Javascript (ESM)
- **Framework**: Express 5.x
- **Database**: MySQL
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT HttpOnly Cookie + bcryptjs/argon2id
- **Logging**: Pino + pino-http + pino-pretty
- **API Doc**: swagger-jsdoc + swagger-ui-express
- **Testing**: Jest + Supertest
- **File Storage**: Cloudinary
- **Payment**: VNPay, MoMo

### Frontend

- **Framework**: React 19 + JSX
- **UI Library**: Material UI + Bootstrap 5
- **HTTP Client**: Axios (với credentials: include)
- **Form**: React Hook Form
- **Testing**: Jest + React Testing Library

### Nguyên tắc chọn công nghệ

- Ưu tiên stability và community support hơn bleeding-edge features
- Tránh vendor lock-in khi có thể
- Chọn tools có documentation tốt và actively maintained

## 3. Quy tắc nghiệp vụ VMS (Domain Rules)

### Event & Capacity rules (Sự kiện và Sức chứa)

1. **Sức chứa**: `event.approved_participants <= event.max_capacity` luôn phải đúng trước và sau mọi thao tác duyệt đơn. TUYỆT ĐỐI KHÔNG duyệt đơn vượt quá số lượng cho phép.
2. **Bất biến trạng thái**: Không được phép chỉnh sửa thông tin cốt lõi của Sự kiện khi sự kiện đang diễn ra (`In Progress`) hoặc đã kết thúc (`Completed`).
3. **Điều chỉnh tham gia**: Tình nguyện viên chỉ có thể hủy đăng ký khi sự kiện chưa diễn ra. Đối với no-show, phải xử lý thông qua Điểm danh (Attendance Check), KHÔNG dùng chức năng Hủy đơn.

### Application rules (Quy tắc xét duyệt đơn)

1. **Luồng trạng thái một chiều**: Đơn đăng ký đã chuyển sang `Approved` hoặc `Rejected` thì TUYỆT ĐỐI KHÔNG được quay ngược lại trạng thái `Pending`.
2. **Điều kiện hợp lệ**: Chỉ tình nguyện viên có account hợp lệ (`is_active: true`) mới được tạo Application.

### Attendance & Certificate rules (Điểm danh và Chứng nhận)

1. **Ràng buộc điểm danh**: Chỉ có thể điểm danh cho những tình nguyện viên có đơn đăng ký ở trạng thái `Approved`.
2. **Điều kiện cấp chứng nhận**: TUYỆT ĐỐI KHÔNG cấp phát chứng nhận cho Tình nguyện viên không có dữ liệu điểm danh hợp lệ.
3. **Tính duy nhất**: Mỗi tình nguyện viên chỉ được cấp tối đa 1 chứng nhận cho mỗi sự kiện hoàn thành.

### Donation & Payment rules (Quyên góp và Thanh toán)

1. **Tính bất biến của giao dịch**: Giao dịch quyên góp qua VNPay/MoMo sau khi ghi nhận trạng thái `Success` là dữ liệu bất biến. TUYỆT ĐỐI KHÔNG tự ý cập nhật/sửa đổi số tiền hoặc trạng thái.
2. **Rollback thanh toán**: Các giao dịch lỗi hoặc timeout phải chuyển sang `Failed` hoặc `Cancelled`, không được kẹt vĩnh viễn ở trạng thái `Pending`.

### Soft delete rules (Quy tắc xóa dữ liệu)

**Chi tiết rationale và consequences xem ADR-005 tại `CLAUDE.md` Section 3.**

1. **Master data**: User, Organization, Event, Category, Skill → Soft delete (`is_active = false`)
2. **Transaction data**: Application, Donation, Feedback → State transition (`status = cancelled/rejected`)

## 4. Quy chuẩn đặt tên (Naming Conventions)

**Xem chi tiết đầy đủ file naming patterns tại `CLAUDE.md` Section 2.**

Tóm tắt:

- Backend: `[resource].[layer].js` (event.controller.js, user.service.js)
- Frontend Components: PascalCase JSX (EventList.jsx)
- Database Tables: snake_case (volunteer_applications)
- API Endpoints: kebab-case (/api/v1/volunteer-events)

## 5. Module Ownership (Phân công 5 thành viên)

**Xem bảng phân công module LIVE (với status updates) tại `share_context.md` Section 1.**

**Quy tắc Cross-Module (STRICT)**:

- Modules giao tiếp qua Service layer contracts, KHÔNG import trực tiếp Repository của module khác
- Thay đổi logic trong module của thành viên khác CHỈ được phép khi:
  1. Có xác nhận từ chủ sở hữu module
  2. Thay đổi được định nghĩa rõ trong Swagger documentation

## 6. Architecture Principles

**Xem chi tiết ADRs (Architectural Decision Records) tại `CLAUDE.md` Section 3.**  
**Xem Anti-Patterns và Lessons Learned tại `CLAUDE.md` Sections 4-5.**

### Layered Architecture

Tuân thủ kiến trúc phân tầng: **Controller → Service → Repository**

- Tầng **Repository** là nơi duy nhất giao tiếp trực tiếp với Database thông qua Prisma Client.
- Business logic và validation BẮT BUỘC ở Service layer (xem ADR-001, Lesson 1).

### Module Boundaries

Modules giao tiếp qua **Service layer**, TUYỆT ĐỐI KHÔNG import Repository của module khác (xem Anti-Patterns).

### Core Standards

- **API Style**: RESTful với prefix `/api/v1/[resource]`
- **Response Format**: Tuân thủ ADR-006 tại `CLAUDE.md`. Dùng `backend/src/utils/response.util.js`
- **Database Access**: Prisma ORM only (ADR-001)
- **Logging**: Tuân thủ quy tắc Logging và Anti-Patterns tại `CLAUDE.md` Sections 3-5

## 7. Code & Quality Rules

- **NodeJS (Backend)**: Bắt buộc sử dụng `async/await` cho các xử lý bất đồng bộ (tránh callback hell), và ném lỗi rõ ràng để middleware xử lý tập trung.
- **React (Frontend)**: BẮT BUỘC dùng `PropTypes` để kiểm tra chặt chẽ các props. Không sử dụng biến global hoặc `var`, ưu tiên `const` và `let`.
- **Kích thước file & hàm**: Max function length: 40 dòng; max file length: 300 dòng.
- **Comments**: Comments chỉ dùng để giải thích TẠI SAO (why), TUYỆT ĐỐI KHÔNG giải thích ĐANG LÀM GÌ (what).
- **Kiểm thử (Testing)**: Test coverage tối thiểu bắt buộc là **80%** cho Service layer. Sử dụng `Jest` cho cả Backend và Frontend.
- **Tài liệu API**: BẮT BUỘC cập nhật giao kèo vào `share_context.md` VÀ viết đầy đủ comment Swagger JSDoc (@swagger) ngay phía trên code của endpoint. Các comment Swagger bắt buộc phải định nghĩa rõ Request Body, các mã Response lỗi và kèm theo ví dụ cụ thể.

## 8. Error Handling & Safety

**Xem Lessons Learned và Anti-Patterns chi tiết tại `CLAUDE.md` Sections 4-5.**

### AI Agent Safety Rules

- **Clarification-First**: Yêu cầu mơ hồ → Hỏi lại, KHÔNG tự đoán
- **Kiểm tra tác động VMS Core**: Trước khi sửa Event, Application, Attendance, Certificate, Donation
- **Đọc ngữ cảnh đa tầng**: Đọc chéo `CLAUDE.md`, `share_context.md`, `SPEC.md` cho changes có rủi ro cao
- **Shadow Plan**: Thao tác phá hủy dữ liệu → Báo cáo và chờ phê duyệt
- **Loop Trap**: Thất bại 3 lần liên tiếp → DỪNG và yêu cầu con người hỗ trợ
- **Fix the Spec, not the Code**: Spec sai → Báo cáo để update Spec trước

## 9. Definition of Done (Tiêu chí hoàn thành)

- [ ] Unit tests đã được viết và passing (Tối thiểu 80% coverage cho Services).
- [ ] Integration tests cho tất cả API endpoints (Cover cả happy path + error paths).
- [ ] Không có lỗi linting/type errors (`npm run lint` pass).
- [ ] API endpoint bắt buộc được document đầy đủ trong Swagger.
- [ ] Các trường hợp lỗi ĐÃ ĐƯỢC handle với HTTP status codes chuẩn (400, 401, 403, 404, 409, 500).
- [ ] Đã ghi nhận Audit log cho các luồng thay đổi trạng thái quan trọng.
- [ ] TUYỆT ĐỐI KHÔNG để lại comments dạng `TODO` hoặc `FIXME` trong code chuẩn bị merge.
- [ ] Các logic nghiệp vụ cốt lõi của VMS ĐÃ ĐƯỢC test nghiêm ngặt.

## 10. Git Conventions

### Branch naming

- `feat/[feature-name]` — tính năng mới
- `fix/[bug-name]` — sửa lỗi
- `spec/[feature-name]` — viết spec
- `chore/[short-name]` — cập nhật nhỏ

### Commit format

`[type]([scope]): [description]`

Example: `feat(auth): implement volunteer login API`

### PR rules (Pull Request)

- Min 1 approval before merge
- Max 400 lines changed; larger work should be split
- Never commit trực tiếp vào `main`/`Dev`

---

**Version**: 5.0  
**Last Updated**: 2026-06-25  
**Changelog**:

- v5.0: Tái cấu trúc theo bộ khung mới - tập trung vào Persona, Tech Stack, Domain Rules và Naming Conventions
- v5.0: Thêm Module Ownership chi tiết cho 5 members dựa trên team.docx
- v5.0: Rút gọn Architecture Principles, loại bỏ GitNexus section (chuyển sang CLAUDE.md)