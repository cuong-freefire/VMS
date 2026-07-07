/**
 * User Routes
 *
 * Các endpoint liên quan đến thông tin người dùng:
 * - GET /me: Xem hồ sơ cá nhân (UC18 - View Profile)
 *
 * Prefix: /api/v1/user (mount tại app.js)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getMyProfile } from "../controllers/profile.controller.js";

const router = Router();

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Xem hồ sơ cá nhân (View Profile)
 *     description: |
 *       Trả về thông tin hồ sơ cá nhân của người dùng đã đăng nhập (Private Profile).
 *       Bao gồm: họ tên, email, số điện thoại, ảnh đại diện và danh sách kỹ năng.
 *       Dữ liệu nhạy cảm (password_hash, role_id, ...) đã được loại bỏ khỏi response.
 *
 *       **Nguyên tắc bảo mật**:
 *       - Chỉ xem hồ sơ của chính mình (self-view only)
 *       - userId lấy từ JWT token, KHÔNG từ request params/body
 *       - Từ chối nếu tài khoản bị vô hiệu hóa (is_active = false)
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công - Trả về thông tin hồ sơ đã được làm sạch
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
 *                   example: "Lấy thông tin hồ sơ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                       example: "0123456789"
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://cloudinary.com/avatars/user123.jpg"
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           skill_id:
 *                             type: integer
 *                             example: 1
 *                           skill_name:
 *                             type: string
 *                             example: "Giao tiếp"
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                 details:
 *                   nullable: true
 *             examples:
 *               noToken:
 *                 summary: Không có token
 *                 value:
 *                   success: false
 *                   message: "Vui lòng đăng nhập."
 *                   code: "UNAUTHORIZED"
 *                   details: null
 *               invalidToken:
 *                 summary: Token không hợp lệ
 *                 value:
 *                   success: false
 *                   message: "Phiên đăng nhập không hợp lệ."
 *                   code: "TOKEN_INVALID"
 *                   details: null
 *       403:
 *         description: Tài khoản đã bị vô hiệu hóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tài khoản đã bị vô hiệu hóa"
 *                 code:
 *                   type: string
 *                   example: "ACCOUNT_DISABLED"
 *                 details:
 *                   nullable: true
 *       404:
 *         description: Tài khoản không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tài khoản không tồn tại"
 *                 code:
 *                   type: string
 *                   example: "USER_NOT_FOUND"
 *                 details:
 *                   nullable: true
 *       500:
 *         description: Lỗi máy chủ nội bộ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Có lỗi xảy ra trong quá trình xử lý"
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_SERVER_ERROR"
 *                 details:
 *                   nullable: true
 */
router.get("/me", authMiddleware, getMyProfile);

export default router;
