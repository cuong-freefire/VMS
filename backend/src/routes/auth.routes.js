/**
 * Authentication Routes
 *
 * Các endpoint liên quan đến xác thực người dùng:
 * - Login: Đăng nhập và nhận JWT token trong httpOnly cookie
 * - Logout: Xóa JWT token khỏi cookie
 *
 * Prefix: /auth (được mount tại app.js)
 * Nên refactor thành /api/v1/auth theo RESTful convention
 */

import { Router } from 'express';
import { login, sendOTPController, verifyOTPController, logout, requestResetPassword, verifyResetOTP, resetPassword } from '../controllers/auth.controller.js';
import { validate, loginSchema, sendOTPSchema, verifyOTPSchema, requestResetSchema, verifyResetOTPSchema, resetPasswordSchema } from '../middlewares/validators/auth.validator.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     description: |
 *       Xác thực người dùng bằng email và password.
 *       Nếu thành công, JWT token sẽ được trả về trong httpOnly cookie.
 *       Cookie này sẽ tự động được gửi kèm các requests tiếp theo.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của người dùng
 *                 example: volunteer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu của người dùng (plain text)
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, JWT token được set trong cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Đăng nhập thành công
 *               data:
 *                 id: 1
 *                 email: volunteer@example.com
 *                 name: John Doe
 *                 role: volunteer
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (email/password thiếu hoặc sai format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email hoặc password chưa được cung cấp
 *               code: VALIDATION_ERROR
 *               details: null
 *       401:
 *         description: Email hoặc mật khẩu không chính xác (tài khoản không tồn tại hoặc sai password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email hoặc mật khẩu chưa chính xác
 *               code: UNAUTHORIZED
 *               details: null
 *       500:
 *         description: Lỗi server (database, internal error)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Có lỗi xảy ra trong quá trình xử lý
 *               code: INTERNAL_SERVER_ERROR
 *               details: null
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/register/send-otp:
 *   post:
 *     summary: Gửi OTP để xác thực email (Bước 1 đăng ký)
 *     description: |
 *       Gửi mã OTP 6 chữ số đến email của người dùng.
 *       - Kiểm tra email chưa được dùng
 *       - Áp dụng cooldown 60 giây giữa các lần gửi
 *       - Khóa email sau 5 lần nhập sai (15 phút)
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: volunteer@vms.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
 *                     cooldown_seconds:
 *                       type: number
 *                       example: 60
 *       400:
 *         description: Email không hợp lệ
 *       409:
 *         description: Email đã được sử dụng
 *       429:
 *         description: Cooldown chưa qua hoặc email bị khóa
 *       503:
 *         description: Dịch vụ email không khả dụng
 */
router.post('/register/send-otp', validate(sendOTPSchema), sendOTPController);

/**
 * @swagger
 * /api/v1/auth/register/verify-otp:
 *   post:
 *     summary: Xác thực OTP và tạo tài khoản (Bước 2 đăng ký)
 *     description: |
 *       Xác thực mã OTP và tạo tài khoản mới với vai trò Volunteer.
 *       - Kiểm tra OTP hợp lệ (6 chữ số, chưa hết hạn 10 phút)
 *       - Hash mật khẩu với bcryptjs (12 rounds)
 *       - Tạo user mới trong database
 *       - Xóa record xác thực
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: volunteer@vms.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               phoneNumber:
 *                 type: string
 *                 example: "0912345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit
 *                 example: "Password123"
 *             required:
 *               - email
 *               - otp
 *               - fullName
 *               - phoneNumber
 *               - password
 *     responses:
 *       201:
 *         description: Tài khoản được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.
 *                     userId:
 *                       type: number
 *                       example: 123
 *       400:
 *         description: OTP không hợp lệ, hết hạn, hoặc validation error
 *       429:
 *         description: Email bị khóa sau 5 lần nhập sai
 *       500:
 *         description: Lỗi server
 */
router.post('/register/verify-otp', validate(verifyOTPSchema), verifyOTPController);
/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     description: |
 *       Xóa JWT token khỏi httpOnly cookie và kết thúc phiên làm việc.
 *       Idempotent design — luôn trả về 200 OK.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Đăng xuất thành công (idempotent)
 *         headers:
 *           Set-Cookie:
 *             description: Clear token cookie
 *             schema:
 *               type: string
 *               example: token=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công
 *                 data:
 *                   type: object
 *                   example: {}
 */
router.post('/logout', logout);
/**
 * @swagger
 * /api/v1/auth/forgot-password/request:
 *   post:
 *     summary: Yêu cầu OTP đặt lại mật khẩu (UC07 Bước 1)
 *     description: |
 *       Gửi mã OTP 6 chữ số đến email để xác thực danh tính.
 *       - Zero enumeration: response giống nhau cho email tồn tại và không tồn tại
 *       - Cooldown 60s giữa các lần gửi
 *       - Lockout 15 phút sau 5 lần nhập sai OTP
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Thành công (kể cả email không tồn tại)
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi."
 *               data:
 *                 cooldown_seconds: 60
 *       400:
 *         description: Email không hợp lệ
 *       429:
 *         description: Cooldown chưa qua hoặc email bị khóa
 */
router.post('/forgot-password/request', validate(requestResetSchema), requestResetPassword);

/**
 * @swagger
 * /api/v1/auth/forgot-password/verify-otp:
 *   post:
 *     summary: Xác thực OTP đặt lại mật khẩu (UC07 Bước 2)
 *     description: |
 *       Xác thực mã OTP 6 chữ số.
 *       - OTP hết hạn sau 10 phút
 *       - Lockout sau 5 lần nhập sai (15 phút)
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 verified: true
 *                 message: "Mã OTP xác thực thành công."
 *       400:
 *         description: OTP không đúng hoặc hết hạn
 *       404:
 *         description: Không tìm thấy OTP
 *       429:
 *         description: Email bị khóa
 */
router.post('/forgot-password/verify-otp', validate(verifyResetOTPSchema), verifyResetOTP);

/**
 * @swagger
 * /api/v1/auth/forgot-password/reset:
 *   post:
 *     summary: Đặt lại mật khẩu mới (UC07 Bước 3)
 *     description: |
 *       Đặt mật khẩu mới sau khi OTP đã được xác thực.
 *       - Yêu cầu mật khẩu: ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
 *       - Xóa OTP record sau khi đổi mật khẩu thành công
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewPass@123"
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Mật khẩu đã được đặt lại thành công."
 *       400:
 *         description: OTP không hợp lệ hoặc mật khẩu không đủ mạnh
 *       403:
 *         description: Tài khoản bị vô hiệu hóa
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.post('/forgot-password/reset', validate(resetPasswordSchema), resetPassword);


export default router;