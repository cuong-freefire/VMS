# Research: Authentication Register Technical Decisions

**Feature**: UC04 - Authentication Register (OTP Email Verification)

**Date**: 2026-06-29

**Status**: COMPLETED

---

## R1: OTP Generation Strategy (Chiến lược sinh OTP)

**Decision (Quyết định):** Sử dụng `crypto.randomInt(100000, 999999)` từ module crypto của Node.js

**Rationale (Lý do):**
- `crypto.randomInt()` an toàn về mặt mật mã (sử dụng CSPRNG)
- Tạo trực tiếp số nguyên trong khoảng [100000, 999999] cho OTP 6 chữ số
- Không cần thao tác chuỗi hoặc phép chia lấy dư có thể gây sai lệch
- Có sẵn trong Node.js (không cần thư viện bên ngoài)
- Hiệu năng: ~0.01ms mỗi lần tạo (chi phí không đáng kể)

**Alternatives Considered (Phương án thay thế):**

1. **crypto.randomBytes() + toString()**
   - Phức tạp hơn: cần chuyển đổi buffer → hex → integer
   - Có thể gây sai lệch nếu không triển khai cẩn thận
   - Từ chối: Độ phức tạp không cần thiết

2. **Math.random()**
   - KHÔNG an toàn về mặt mật mã (sử dụng PRNG, không phải CSPRNG)
   - Có thể đoán được nếu kẻ tấn công biết seed
   - Từ chối: Lỗ hổng bảo mật

3. **UUID/nanoid libraries**
   - Quá mức cần thiết cho OTP số 6 chữ số
   - Thêm phụ thuộc
   - Từ chối: Giải pháp có sẵn đơn giản hơn

**Implementation (Triển khai):**

```javascript
// backend/src/utils/otp.util.js
import crypto from 'crypto';

export function generateOTP() {
  // Generate cryptographically secure 6-digit OTP
  return crypto.randomInt(100000, 999999).toString();
}
```

**Security Note**: OTP 6 chữ số cung cấp 1,000,000 tổ hợp khả dĩ. Kết hợp với khóa sau 5 lần thử và hết hạn sau 10 phút, điều này cung cấp khả năng bảo vệ đầy đủ trước các cuộc tấn công brute-force.

---

## R2: OTP Hashing Algorithm (Thuật toán băm OTP)

**Decision (Quyết định):** Sử dụng bcrypt với 10 vòng (không phải 12) cho việc băm OTP

**Rationale (Lý do):**
- bcrypt là tiêu chuẩn ngành cho băm mật khẩu, đã được kiểm chứng kỹ lưỡng
- 10 vòng cung cấp bảo mật tốt cho token ngắn hạn (TTL 10 phút)
- Số vòng thấp hơn mật khẩu (12) vì OTP được xác minh một lần so với mật khẩu được xác minh nhiều lần
- Hiệu năng: ~100ms mỗi lần băm/so sánh trên phần cứng thông thường (chấp nhận được cho luồng OTP)
- Đã là phụ thuộc của dự án (dùng cho mật khẩu)

**Alternatives Considered (Phương án thay thế):**

1. **argon2id**
   - Hiện đại hơn, chiến thắng Password Hashing Competition 2015
   - Kháng GPU/ASIC tốt hơn
   - Từ chối: Thêm phụ thuộc mới, quá mức cho OTP ngắn hạn, bcrypt đã đủ

2. **SHA-256 + salt**
   - Nhanh hơn bcrypt (~1ms)
   - Không thích ứng: dễ bị brute-force với phần cứng chuyên dụng
   - Từ chối: Hệ số công việc thích ứng của bcrypt cung cấp bảo mật tốt hơn

3. **Plain text storage**
   - Từ chối: Vi phạm bảo mật nghiêm trọng (ràng buộc Tầng 1)

**Implementation (Triển khai):**

```javascript
// backend/src/utils/otp.util.js
import bcrypt from 'bcryptjs';

const OTP_SALT_ROUNDS = 10; // Lower than password (12) for performance

export async function hashOTP(otp) {
  return await bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

export async function verifyOTP(otp, hash) {
  return await bcrypt.compare(otp, hash);
}
```

**Performance Impact**: 
- Thời gian băm: ~80-100ms mỗi OTP
- Thời gian so sánh: ~80-100ms mỗi lần xác minh
- Chấp nhận được cho luồng đăng ký (không nằm trong đường dẫn quan trọng)

---

## R3: Email Template Approach (Phương án mẫu email)

**Decision (Quyết định):** Email thuần văn bản với định dạng tối thiểu cho MVP

**Rationale (Lý do):**
- Email thuần văn bản có tỷ lệ gửi đến cao nhất trên các nhà cung cấp email
- Không có vấn đề hiển thị HTML trên các trình khách khác nhau
- Kích thước email nhỏ hơn (gửi nhanh hơn)
- Đủ cho use case gửi OTP
- Có thể nâng cấp lên HTML trong Giai đoạn 2 mà không gây thay đổi phá vỡ

**Alternatives Considered (Phương án thay thế):**

1. **Rich HTML template with CSS**
   - Thương hiệu và hình ảnh đẹp hơn
   - Nguy cơ bị lọc spam cao hơn
   - Phức tạp trong bảo trì mẫu
   - Từ chối cho MVP: Khả năng gửi đến > thẩm mỹ

2. **HTML with inline CSS**
   - Khả năng gửi đến tốt hơn CSS ngoài
   - Vẫn phức tạp hơn thuần văn bản
   - Hoãn sang Giai đoạn 2: Lựa chọn trung gian tốt cho tương lai

**Implementation (Triển khai):**

```javascript
// backend/src/utils/email.util.js
export function generateOTPEmailContent(otp, email) {
  const subject = 'Mã xác thực đăng ký VMS';
  
  const text = `
Xin chào,

Bạn đã yêu cầu đăng ký tài khoản tình nguyện viên tại VMS.

Mã xác thực OTP của bạn là: ${otp}

Mã này có hiệu lực trong 10 phút kể từ khi nhận được email này.

Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.

---
Volunteer Management System (VMS)
Email: support@vms.com
  `.trim();

  return { subject, text };
}
```

**Email Deliverability Checklist** (cho production):
- [ ] Bản ghi SPF được cấu hình cho tên miền gửi
- [ ] Chữ ký DKIM được kích hoạt
- [ ] Sử dụng dịch vụ SMTP uy tín (SendGrid/AWS SES)
- [ ] Theo dõi tỷ lệ trả lại/khiếu nại

---

## R4: Cooldown Implementation (Triển khai Cooldown)

**Decision (Quyết định):** Cooldown dựa trên cơ sở dữ liệu sử dụng timestamp `last_sent_at` trong bảng `email_verifications`

**Rationale (Lý do):**
- Spec yêu cầu rõ ràng lưu trữ cơ sở dữ liệu (không phải Redis)
- Cooldown tồn tại qua các lần khởi động lại server
- Cập nhật nguyên tử ngăn chặn race condition
- Nhất quán với kiến trúc dự án (không có Redis trong stack hiện tại)
- Chi phí truy vấn chấp nhận được (<10ms) cho tần suất luồng đăng ký

**Alternatives Considered (Phương án thay thế):**

1. **Redis with TTL**
   - Nhanh hơn (trong bộ nhớ)
   - Yêu cầu hạ tầng bổ sung
   - Từ chối: Spec yêu cầu cơ sở dữ liệu, dự án không dùng Redis

2. **In-memory Map in Node.js**
   - Nhanh nhất (không I/O)
   - Mất khi khởi động lại server
   - Không bảo vệ được khi có nhiều instance server
   - Từ chối: Không bền vững, không mở rộng được

**Implementation (Triển khai):**

```javascript
// backend/src/services/auth.service.js
async function checkCooldown(email) {
  const record = await authRepository.findVerificationByEmail(email);
  
  if (!record) {
    return { canSend: true };
  }
  
  const COOLDOWN_SECONDS = 60;
  const now = new Date();
  const lastSent = new Date(record.last_sent_at);
  const elapsedSeconds = Math.floor((now - lastSent) / 1000);
  
  if (elapsedSeconds < COOLDOWN_SECONDS) {
    return {
      canSend: false,
      remainingSeconds: COOLDOWN_SECONDS - elapsedSeconds
    };
  }
  
  return { canSend: true };
}
```

**Database Query**:
```sql
SELECT last_sent_at FROM email_verifications WHERE email = ?
```

**Performance**: Truy vấn có chỉ mục đơn (~5-10ms), chấp nhận được cho kiểm tra cooldown.

---

## R5: Frontend State Management (Quản lý trạng thái Frontend)

**Decision (Quyết định):** React useState với state của component cha (không lưu trữ bền vững)

**Rationale (Lý do):**
- State của form nhiều bước là tạm thời (phạm vi phiên)
- Không cần global state (chỉ 2 bước, một tính năng)
- Bảo mật: State bị xóa khi tải lại trang (ngăn OTP cũ trong trình duyệt)
- Triển khai đơn giản không cần thư viện ngoài
- Nhất quán với kiến trúc frontend VMS (quản lý state tối thiểu)

**Alternatives Considered (Phương án thay thế):**

1. **sessionStorage for persistence**
   - Ưu: Tồn tại qua tải lại trang trong phiên
   - Nhược: Lưu dữ liệu nhạy cảm (mật khẩu) trong trình duyệt, rủi ro bảo mật
   - Từ chối: Lo ngại bảo mật lớn hơn lợi ích UX

2. **React Context API**
   - Ưu: State tập trung cho nhiều component
   - Nhược: Quá mức cho luồng tuyến tính 2 bước
   - Từ chối: Độ phức tạp không cần thiết

3. **Redux/Zustand**
   - Ưu: Quản lý state mạnh mẽ
   - Nhược: Phụ thuộc nặng cho form đơn giản
   - Từ chối: Không xứng đáng với phạm vi tính năng

**Implementation (Triển khai):**

```javascript
// frontend/src/components/auth/RegisterForm.jsx
function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    password: '',
    confirm_password: ''
  });
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const goToStep = (step) => {
    setCurrentStep(step);
  };
  
  return (
    <>
      {currentStep === 1 && (
        <RegisterStep1 
          formData={formData}
          updateFormData={updateFormData}
          goToStep={goToStep}
        />
      )}
      {currentStep === 2 && (
        <RegisterStep2
          formData={formData}
          updateFormData={updateFormData}
          goToStep={goToStep}
        />
      )}
    </>
  );
}
```

**State Flow**:
- Bước 1: Người dùng điền form → State được lưu trong component cha
- Bước 1 → Bước 2: Truyền formData qua props
- Bước 2: Người dùng có thể quay lại, chỉnh sửa dữ liệu, tiếp tục (state được bảo toàn)
- Tải lại trang: State bị mất (biện pháp bảo mật có chủ đích)

---

## R6: Error Message Strategy (Chiến lược thông báo lỗi)

**Decision (Quyết định):** Thông báo lỗi cụ thể với đánh đổi liệt kê tài khoản được chấp nhận

**Rationale (Lý do):**
- **Ưu tiên UX**: Thông báo lỗi rõ ràng giúp người dùng hợp pháp ("Email đã đăng ký" → chuyển sang đăng nhập)
- **Đánh đổi bảo mật**: Liệt kê email là RỦI RO THẤP cho VMS vì:
  - VMS không phải mục tiêu giá trị cao (không có dữ liệu tài chính)
  - Tài khoản tình nguyện viên bán công khai về bản chất (hồ sơ hiển thị sau sự kiện)
  - Giới hạn tốc độ trên endpoint đăng ký ngăn chặn liệt kê tự động
  - Lợi ích cho người dùng hợp pháp lớn hơn rủi ro liệt kê
- **Thực tiễn ngành**: Nhiều ứng dụng phổ biến (GitHub, LinkedIn) tiết lộ sự tồn tại của tài khoản để UX tốt hơn

**Alternatives Considered (Phương án thay thế):**

1. **Generic error messages**
   - Ví dụ: "Đăng ký thất bại. Vui lòng thử lại."
   - Ưu: Ngăn chặn liệt kê email
   - Nhược: UX khó hiểu, người dùng không biết tại sao thất bại
   - Từ chối: UX kém cho hệ thống rủi ro bảo mật thấp

2. **Rate-limited check endpoint**
   - Endpoint GET /check-email riêng với giới hạn tốc độ nghiêm ngặt
   - Ưu: Cho phép kiểm tra mà không tiết lộ trong lỗi
   - Nhược: Thêm phức tạp, vẫn tiết lộ qua giới hạn tốc độ
   - Từ chối: Độ phức tạp không xứng đáng

**Implementation (Triển khai):**

```javascript
// Specific error messages
const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.',
  EMAIL_LOCKED: 'Email đã bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau {minutes} phút.',
  COOLDOWN_ACTIVE: 'Vui lòng đợi {seconds} giây trước khi gửi lại OTP.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.',
  OTP_INCORRECT: 'Mã OTP không đúng. Bạn còn {attempts} lần thử.',
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
};
```

**Rate Limiting Protection**:
- Tối đa 10 lần thử đăng ký mỗi IP mỗi giờ (triển khai trong Giai đoạn 2)
- Tối đa 5 lần thử xác minh OTP mỗi email (đã có trong spec)
- Ngăn chặn tấn công liệt kê email tự động

**Security Monitoring**:
- Ghi log các lần thử đăng ký thất bại quá mức từ cùng IP
- Cảnh báo các mẫu đáng ngờ (>100 email được kiểm tra trong thời gian ngắn)

---

## Summary of Decisions (Tổng kết quyết định)

| Decision Area | Choice | Key Rationale |
|---------------|--------|---------------|
| OTP Generation | crypto.randomInt() | Cryptographically secure, simple API |
| OTP Hashing | bcrypt 10 rounds | Industry standard, adequate for short-lived tokens |
| Email Template | Plain text | Best deliverability for MVP |
| Cooldown | Database timestamp | Spec requirement, persistent across restarts |
| Frontend State | React useState | Simple, secure (no persistence) |
| Error Messages | Specific messages | UX priority, low risk for VMS use case |

---

**Research Phase Complete**: Tất cả quyết định kỹ thuật đã được ghi nhận và giải thích. Sẵn sàng chuyển sang Giai đoạn 1 (Design & Contracts).
