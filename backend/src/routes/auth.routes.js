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
import { login, sendOTPController, verifyOTPController } from '../controllers/auth.controller.js';
import { validate, loginSchema, sendOTPSchema, verifyOTPSchema } from '../middlewares/validators/auth.validator.js';

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

export default router;


