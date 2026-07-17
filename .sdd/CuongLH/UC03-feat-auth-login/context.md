# CONTEXT.md — Authentication Login (UC03)

# Người viết: CuongLH (Member 1) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS có 5 nhóm người dùng phân quyền rõ rệt (Guest, Volunteer, Staff, Manager, Admin). Ngoại trừ Guest, tất cả các nhóm khác cần một cơ chế xác thực danh tính an toàn để truy cập vào hệ thống, quản lý hồ sơ, và thực hiện các nghiệp vụ như đăng ký sự kiện hay phê duyệt đơn. Nếu không có tính năng đăng nhập bảo mật, hệ thống không thể phân quyền và bảo vệ dữ liệu nghiệp vụ cốt lõi.

## 2. DOMAIN KNOWLEDGE

- **Authentication Method:** Hệ thống sử dụng JWT (JSON Web Token) được lưu trong HttpOnly Cookie để xác thực người dùng. Cookie name hardcoded là 'token'.
- **Data Status:** Người dùng bị vô hiệu hóa (xóa mềm - `isActive: false`) sẽ không được phép đăng nhập vào hệ thống. Người dùng chưa xác thực email (`emailVerified: false`) cũng bị chặn.
- **Roles:** Quyền của người dùng không được hardcode mà map theo `roleId` duy nhất từ database. JWT payload chứa `role_name` để Frontend điều hướng (ví dụ: Volunteer vào trang /home, Admin vào /admin/dashboard) qua `roleRouteMap`.

## 3. STAKEHOLDERS

- **Người dùng cuối (Volunteer, Staff, Manager, Admin):** Cần trải nghiệm đăng nhập nhanh chóng, mượt mà và có thông báo lỗi rõ ràng nếu sai thông tin.
- **Admin/Security:** Yêu cầu bảo mật tài khoản, chống bị tấn công dò quét mật khẩu (brute-force).

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Tech Stack Backend:** Bắt buộc dùng `bcryptjs` để kiểm tra hash mật khẩu (12 rounds, hardcoded). Bắt buộc tạo JWT token (7d, hardcoded). Validate dữ liệu đầu vào bằng `Zod` trước khi query database. Sử dụng `ServiceError` class để throw error từ Service layer (message, status, code, details).
- **Tech Stack Frontend:** Phải có trạng thái loading, chặn double-submit khi đang gọi API, và báo lỗi bằng `react-toastify`. Phân biệt toast.warning (ACCOUNT_LOCKED - autoClose 8000ms) và toast.error (các lỗi khác). Xử lý response từ axiosApi đã có interceptor tự xử lý `response.data`.
- **Security:** Tuyệt đối không lưu mật khẩu hoặc token dưới dạng plaintext trong logs. Dùng Pino logger (không dùng console.log). Error message không được rò rỉ việc "email có tồn tại hay không" để chống dò quét (ví dụ: chỉ báo "Email hoặc mật khẩu chưa chính xác", code "UNAUTHORIZED").
- **API First:** Bắt buộc phải có comment Swagger JSDoc đầy đủ cho endpoint `POST /api/v1/auth/login`.
- **Response Format:** Tuân thủ `response.util.js`: `successResponse(data, message)` → `{success, message, data}`, `errorResponse(message, code, details)` → `{success, message, code, details}`.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định người dùng đăng nhập bằng Email và Password.
- Giả định mật khẩu trong Database đã được hash bằng bcrypt từ lúc Đăng ký (Register).
- Giả định Backend sẽ trả về JWT token thông qua HttpOnly Cookie để đảm bảo bảo mật (chống XSS(Cross-Site Scripting)) thay vì trả về JSON thường. Frontend không lưu token trong Local Storage và không cần gắn thủ công vào Header, mà chỉ cần gọi axiosApi đã được cấu hình tại **frontend\src\api\axiosApi.js** có sẵn withCredentials: true để tự gắn cookie mỗi lần request từ frontend về backend.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Thời gian sống (TTL) của JWT Token là bao lâu?** (Ví dụ: Access Token 15 phút, Refresh Token 7 ngày? Hay chỉ dùng 1 token sống 24 giờ cho đơn giản?)
2. **Có cơ chế khóa tài khoản (Account Lockout) không?** (Ví dụ: Nhập sai mật khẩu 5 lần liên tiếp sẽ bị khóa tài khoản 15 phút để chống brute-force?)
3. **Người dùng có được đăng nhập cùng lúc trên nhiều thiết bị không?**

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Hệ thống sử dụng một Access Token duy nhất có TTL 7 ngày. Token được lưu trong HttpOnly Cookie với maxAge = 7 ngày. Sau khi hết hạn, người dùng phải đăng nhập lại. Không sử dụng Refresh Token.
- **A2:** Nếu một tài khoản nhập sai mật khẩu 5 lần liên tiếp, hệ thống sẽ khóa đăng nhập tài khoản đó trong 15 phút. Sau thời gian khóa, người dùng có thể thử đăng nhập lại. Lockout track qua `login_attempts` table (MySQL).
- **A3:** Mỗi tài khoản chỉ được phép có một phiên đăng nhập (active session) tại một thời điểm.

   Khi người dùng đăng nhập thành công:

  - Hệ thống tạo JWT chứa jti mới (composite: `${userId}-${timestamp}-${random}`).
  - jti mới được lưu vào database (bảng `user_sessions`) qua Prisma `upsert`.
  - jti cũ của tài khoản bị ghi đè.

Các request sử dụng JWT có jti không khớp với database sẽ bị từ chối với HTTP 401 "LOGGED_IN_ELSEWHERE", đồng thời clear cookie. Session hết hạn (expiresAt < NOW()) sẽ bị xóa khỏi DB và clear cookie với code "SESSION_INVALID".
