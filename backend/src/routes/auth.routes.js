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
import { login } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @swagger
 * /auth/login:
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
router.post('/login', login);

export default router;


