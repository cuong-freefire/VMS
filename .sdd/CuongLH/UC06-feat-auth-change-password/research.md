# Nghiên Cứu: Quyết Định Kỹ Thuật Thay Đổi Mật Khẩu (UC06)

## R1: Constant-Time Password Comparison

**Quyết định**: Sử dụng bcrypt.compare() của thư viện bcryptjs để so sánh mật khẩu cũ với password_hash lưu trong database.

**Biện minh**:

- bcrypt.compare() được thiết kế để chống timing attack bằng cách đảm bảo thời gian so sánh không phụ thuộc vào độ khác biệt giữa mật khẩu nhập và hashed password
- Là best practice tiêu chuẩn trong ngành cho password verification
- Đã được sử dụng trong UC03 (Login) nên tạo consistency

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Direct string comparison: ❌ Không an toàn, bị timing attack
- MD5/SHA-256 so sánh: ❌ Không phải cho password, dễ crack
- bcryptjs.compare(): ✅ Chọn cái này

**Triển Khai**:

```javascript
const isValid = await bcrypt.compare(oldPassword, user.password_hash);
if (!isValid) throw new ServiceError("Mật khẩu cũ không chính xác", 400);
```

---

## R2: Audit Logging Strategy

**Quyết định**: Ghi log 2 loại sự kiện: CHANGE_PASSWORD_SUCCESS và CHANGE_PASSWORD_FAILED, ghi tại service layer sau khi thao tác hoàn thành.

**Biện minh**:

- Giám sát thay đổi mật khẩu là yêu cầu compliance và bảo mật
- Ghi log sau khi thao tác hoàn thành đảm bảo chỉ log thành công hoặc thất bại rõ ràng
- Service layer là nơi phù hợp vì nó xử lý business logic
- TUYỆT ĐỐI KHÔNG log plaintext password, password_hash, hoặc chi tiết lỗi nhạy cảm

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Log ở Controller layer: ❌ Quá sớm, có thể không biết kết quả
- Log ở Middleware: ❌ Không có context về kết quả
- Log ở Service layer: ✅ Chọn cái này

**Triển Khai**:

```javascript
logger.info('CHANGE_PASSWORD_SUCCESS', {
  userId,
  timestamp: new Date().toISOString(),
  ipAddress: req.ip
});

logger.warn('CHANGE_PASSWORD_FAILED', {
  userId,
  reason: 'old_password_incorrect',
  timestamp: new Date().toISOString()
});
```

---

## R3: Database Transaction Rollback

**Quyết định**: Sử dụng Prisma transaction (`prisma.$transaction()`) để wrap việc cập nhật password_hash, đảm bảo atomicity và rollback nếu lỗi.

**Biện minh**:

- Cập nhật mật khẩu là critical operation, KHÔNG được để ở trạng thái trung gian
- Transaction đảm bảo hoặc thành công hoàn toàn hoặc thất bại hoàn toàn
- Prisma transaction xử lý rollback tự động nếu exception xảy ra
- Ngăn data corruption khi có concurrent requests

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Cập nhật trực tiếp: ❌ Không an toàn
- Prisma transaction: ✅ Chọn cái này
- MySQL BEGIN/COMMIT: ❌ Lower-level, Prisma đã wrap

**Triển Khai**:

```javascript
await prisma.$transaction(async (tx) => {
  await tx.user.update({
    where: { id: userId },
    data: { password_hash: newHash, updated_at: new Date() }
  });
  // Nếu có error, tự động rollback
});
```

---

## R4: Client-Side Confirm Password Validation

**Quyết định**: Validate confirmPassword === newPassword ở CẢ frontend và backend. Frontend dùng real-time validation, backend là chốt chặn cuối cùng.

**Biện minh**:

- Frontend validation cải thiện UX (feedback ngay lập tức)
- Backend validation đảm bảo tính toàn vẹn dữ liệu (frontend có thể bị bypass)
- Spec rõ ràng yêu cầu backend phải validate
- Spec yêu cầu gửi cả 3 trường: oldPassword, newPassword, confirmPassword

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Frontend only: ❌ Không an toàn
- Backend only: ✅ An toàn nhưng UX không tốt
- Cả hai: ✅ Chọn cái này

**Triển Khai** (Frontend):

```javascript
const [confirmPassword, setConfirmPassword] = useState('');
const isMatch = newPassword === confirmPassword && newPassword.length > 0;
<input disabled={!isMatch} type="submit" />
```

**Triển Khai** (Backend Zod schema):

```javascript
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Required'),
  newPassword: passwordPolicy,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
```

---

## R5: Error Messages & User Feedback

**Quyết định**: Trả về error messages cụ thể khác nhau cho từng loại lỗi, nhưng KHÔNG tiết lộ thông tin nhạy cảm.

**Biện minh**:

- User-friendly messages giúp người dùng hiểu và khắc phục lỗi
- Cụ thể nhưng không tiết lộ: ví dụ "Mật khẩu cũ không chính xác" chứ không phải "User không tồn tại"
- Ngăn enumeration attack (không tiết lộ user tồn tại hay không)
- Spec yêu cầu thông báo validation rõ ràng

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Generic error cho tất cả: ❌ Không helpful
- Tiết lộ chi tiết: ❌ Không an toàn
- Cụ thể nhưng an toàn: ✅ Chọn cái này

**Triển Khai**:

```javascript
// ✅ User-friendly, specific
"Mật khẩu cũ không chính xác"
"Mật khẩu phải chứa ít nhất 1 ký tự viết hoa"
"Mật khẩu mới và xác nhận không khớp"

// ❌ Avoid - tiết lộ chi tiết hệ thống
"bcrypt comparison failed"
"User row not found"
"Database connection error: ECONNREFUSED"
```

---

## R6: Password Policy Implementation

**Quyết định**: Định nghĩa password policy trong hằng số centralized, sử dụng Zod schema để validate cả frontend và backend.

**Biện minh**:

- Centralized config dễ maintain và update trong tương lai
- Zod schema reusable giữa frontend (validation utils) và backend (controller validator)
- Spec yêu cầu: độ dài 8+ chars, uppercase, lowercase, digit, special char
- Tránh hardcoding policy ở nhiều nơi

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Hardcoded regex: ❌ Khó maintain
- Shared Zod schema: ✅ Chọn cái này
- Database config: ❌ Overkill cho MVP

**Triển Khai**:

```javascript
// shared/validators/passwordPolicy.js
export const passwordPolicy = z.string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/\d/, 'Must contain digit')
  .regex(/[!@#$%^&*]/, 'Must contain special char');
```

---

**Kết luận**: Tất cả 6 quyết định kỹ thuật đã được chốt, sẵn sàng cho Phase 1 Design.
