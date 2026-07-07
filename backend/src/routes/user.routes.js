/**
 * User Routes
 *
 * Các endpoint liên quan đến thông tin người dùng:
 * - GET /me: Xem hồ sơ cá nhân (UC18 - View Profile)
 * - PATCH /me: Cập nhật hồ sơ cá nhân (UC19 - Edit Profile)
 *
 * Prefix: /api/v1/user (mount tại app.js)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import uploadMiddleware from "../middlewares/upload.middleware.js";
import { updateProfileSchema } from "../middlewares/validators/profile.validator.js";
import { getMyProfile, updateMyProfile } from "../controllers/profile.controller.js";
import { errorResponse } from "../utils/response.util.js";
import { validate } from "../middlewares/validators/validate.js";

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

/**
 * Multer error handler wrapper.
 * Multer throw errors qua next(err) - Express 5 không có error handler mặc định
 * phù hợp nên wrap tại đây để trả về JSON chuẩn theo ADR-006.
 */
const handleMulterUpload = (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json(
                    errorResponse("Dung lượng file vượt quá giới hạn 5MB", "LIMIT_FILE_SIZE")
                );
            }
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json(
                    errorResponse(err.message || "Chỉ hỗ trợ định dạng jpg, jpeg, png", "INVALID_FILE_TYPE")
                );
            }
            return res.status(400).json(
                errorResponse(err.message || "Lỗi upload file", "UPLOAD_ERROR")
            );
        }
        next();
    });
};

/**
 * @swagger
 * /api/v1/user/me:
 *   patch:
 *     summary: Cập nhật hồ sơ cá nhân (Edit Profile)
 *     description: |
 *       Cho phép người dùng đã đăng nhập cập nhật thông tin hồ sơ cá nhân.
 *       Hỗ trợ cập nhật từng phần (PATCH): chỉ gửi các trường cần thay đổi.
 *       Chấp nhận cả application/json (text only) và multipart/form-data (có file ảnh).
 *
 *       **Nguyên tắc bảo mật**:
 *       - Chỉ cập nhật hồ sơ của chính mình (self-update only)
 *       - userId lấy từ JWT token, KHÔNG từ request params/body
 *       - Từ chối nếu tài khoản bị vô hiệu hóa (is_active = false)
 *       - Các trường không hợp lệ (email, password, role_id) bị bỏ qua
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: "Nguyễn Văn B"
 *               phone_number:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 11
 *                 example: "0987654321"
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               phone_number:
 *                 type: string
 *                 example: "0987654321"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: "Ảnh đại diện (jpg, jpeg, png - tối đa 5MB)"
 *     responses:
 *       200:
 *         description: Thành công - Trả về thông tin hồ sơ đã được cập nhật
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
 *                   example: "Cập nhật hồ sơ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                       example: "Nguyễn Văn B"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                       example: "0987654321"
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://res.cloudinary.com/demo/image/upload/avatars/abc123.jpg"
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
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc file không đúng định dạng
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
 *               invalidName:
 *                 summary: Họ tên quá ngắn
 *                 value:
 *                   success: false
 *                   message: "Họ tên phải có ít nhất 2 ký tự"
 *                   code: "VALIDATION_ERROR"
 *                   details: null
 *               invalidPhone:
 *                 summary: Số điện thoại sai định dạng
 *                 value:
 *                   success: false
 *                   message: "Số điện thoại không đúng định dạng (VD: 0987654321)"
 *                   code: "VALIDATION_ERROR"
 *                   details: null
 *               invalidFile:
 *                 summary: File ảnh không đúng định dạng
 *                 value:
 *                   success: false
 *                   message: "Chỉ hỗ trợ định dạng jpg, jpeg, png"
 *                   code: "INVALID_FILE_TYPE"
 *                   details: null
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
 *               loggedElsewhere:
 *                 summary: Đăng nhập ở thiết bị khác
 *                 value:
 *                   success: false
 *                   message: "Tài khoản của bạn đã được đăng nhập trên một thiết bị khác."
 *                   code: "LOGGED_IN_ELSEWHERE"
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
 *       413:
 *         description: File vượt quá dung lượng cho phép (5MB)
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
 *                   example: "Dung lượng file vượt quá giới hạn 5MB"
 *                 code:
 *                   type: string
 *                   example: "LIMIT_FILE_SIZE"
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
 *                 code:
 *                   type: string
 *                 details:
 *                   nullable: true
 *             examples:
 *               cloudinaryError:
 *                 summary: Lỗi tải ảnh lên Cloudinary
 *                 value:
 *                   success: false
 *                   message: "Không thể tải ảnh lên. Vui lòng thử lại sau."
 *                   code: "CLOUDINARY_ERROR"
 *                   details: null
 *               internalError:
 *                 summary: Lỗi hệ thống
 *                 value:
 *                   success: false
 *                   message: "Có lỗi xảy ra trong quá trình xử lý"
 *                   code: "INTERNAL_SERVER_ERROR"
 *                   details: null
 */
router.patch(
    "/me",
    handleMulterUpload,
    authMiddleware,
    validate(updateProfileSchema),
    updateMyProfile
);

export default router;
