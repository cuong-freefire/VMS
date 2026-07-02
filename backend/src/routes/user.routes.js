/**
 * User Routes
 *
 * Các endpoint liên quan đến thông tin người dùng:
 * - GET /me: Lấy thông tin người dùng hiện tại (yêu cầu xác thực)
 * - Thêm các endpoint khác như update profile, change password, etc.
 *
 * Prefix: /user (được mount tại app.js)
 * Nên refactor thành /api/v1/users theo RESTful convention
 */

import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { successResponse } from '../utils/response.util.js';

const router = Router();

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     description: |
 *       Endpoint này trả về thông tin của người dùng đã đăng nhập.
 *       Yêu cầu xác thực bằng JWT token trong httpOnly cookie.
 *       Token được kiểm tra bởi authMiddleware.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Get me thành công
 *               data:
 *                 name: Đã lấy name
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ/hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Token không hợp lệ hoặc hết hạn
 *               code: UNAUTHORIZED
 *               details: null
 *       500:
 *         description: Lỗi server
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
router.get('/me', authMiddleware, (req, res) => {
    res
        .status(200)
        .json(successResponse({ name: 'Đã lấy name' }, 'Get me thành công'));
});

export default router;


