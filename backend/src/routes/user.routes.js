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
import { getUsersHandler, getUserByIdHandler, createUserHandler, updateUserHandler } from "../controllers/user.controller.js";
import { errorResponse } from "../utils/response.util.js";
import { validate, validateQuery } from "../middlewares/validators/validate.js";
import { getUsersSchema, userIdSchema, createUserSchema, updateUserSchema } from "../middlewares/validators/user.validator.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

/**
 * Validate route parameter :id cho User Management.
 * UC27 chỉ cần validate params nên không mở rộng shared validate.js.
 */
const validateUserId = (req, res, next) => {
    const result = userIdSchema.safeParse(req.params);

    if (!result.success) {
        return res.status(400).json(
            errorResponse(
                result.error.issues[0].message,
                "VALIDATION_ERROR"
            )
        );
    }

    // Ghi đè lại params sau khi đã parse (string -> number)
    req.params = result.data;

    next();
};

/**
 * GET /api/v1/users
 * Lấy danh sách người dùng (Admin only)
 * UC26: View User List
 * UC30: Filter User — thêm is_active, from_date, to_date params
 */
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only)
 *     description: |
 *       Trả về danh sách người dùng với phân trang, tìm kiếm, lọc theo role.
 *       Hỗ trợ lọc theo trạng thái active/inactive (is_active) và khoảng thời gian tạo (from_date, to_date).
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số items mỗi trang (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email (case-insensitive)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [volunteer, staff, manager, admin]
 *         description: Lọc theo role
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at:desc
 *         description: Sắp xếp (field:direction)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái active (true) / inactive (false)
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày tạo từ (format: YYYY-MM-DD, inclusive)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày tạo đến (format: YYYY-MM-DD, inclusive)
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách người dùng
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách người dùng thành công"
 *               data:
 *                 users:
 *                   - user_id: 1
 *                     full_name: "Nguyễn Văn A"
 *                     email: "nguyenvana@example.com"
 *                     role: "VOLUNTEER"
 *                     is_active: true
 *                     created_at: "2026-01-15T08:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 50
 *                   totalPages: 3
 *       400:
 *         description: Lỗi validation (page, limit, role, sort, is_active, from_date, to_date)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validateQuery(getUsersSchema),
    getUsersHandler
);

/**
 * POST /api/v1/users
 * Tạo người dùng mới (Admin only)
 * UC28: Add User
 */
/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Tạo người dùng mới (Admin only)
 *     description: |
 *       Tạo một tài khoản người dùng mới trong hệ thống.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *       Email phải duy nhất — nếu đã tồn tại trả về 409.
 *       Mật khẩu được hash bằng bcryptjs trước khi lưu.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Họ và tên
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đăng nhập
 *               phone:
 *                 type: string
 *                 description: Số điện thoại (optional)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Mật khẩu (tối thiểu 8 ký tự)
 *               role_id:
 *                 type: integer
 *                 description: ID của role
 *           example:
 *             full_name: "Nguyễn Văn B"
 *             email: "nguyenvanb@example.com"
 *             phone: "0987654321"
 *             password: "password123"
 *             role_id: 1
 *     responses:
 *       201:
 *         description: Tạo user thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Tạo người dùng thành công"
 *               data:
 *                 user_id: 2
 *                 full_name: "Nguyễn Văn B"
 *                 email: "nguyenvanb@example.com"
 *                 role: "VOLUNTEER"
 *                 is_active: true
 *                 created_at: "2026-06-30T12:00:00.000Z"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Lỗi server
 */
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validate(createUserSchema),
    createUserHandler
);

/**
 * GET /api/v1/users/:id
 * Lấy thông tin chi tiết người dùng (Admin only)
 * UC27: View User Detail
 */
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết người dùng (Admin only)
 *     description: |
 *       Trả về thông tin chi tiết của một người dùng theo ID.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *       Nếu ID không tồn tại, trả về 404.
 *       Vẫn trả về user bị soft-delete (is_active = false).
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin chi tiết user
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy thông tin người dùng thành công"
 *               data:
 *                 user_id: 1
 *                 full_name: "Nguyễn Văn A"
 *                 email: "nguyenvana@example.com"
 *                 role: "VOLUNTEER"
 *                 is_active: true
 *                 created_at: "2026-01-15T08:30:00.000Z"
 *       400:
 *         description: User ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       404:
 *         description: User not found
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validateUserId,
    getUserByIdHandler
);

/**
 * PATCH /api/v1/users/:id
 * Cập nhật thông tin người dùng (Admin only)
 * UC29: Edit User
 */
/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Cập nhật thông tin người dùng (Admin only)
 *     description: |
 *       Cập nhật thông tin của một người dùng theo ID.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *       Email không thể thay đổi (bất biến).
 *       Admin không thể tự hạ role của chính mình.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Họ và tên
 *               phone:
 *                 type: string
 *                 description: Số điện thoại
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh đại diện
 *               role_id:
 *                 type: integer
 *                 description: ID của role
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *           example:
 *             full_name: "Nguyễn Văn B (Updated)"
 *             phone: "0909123456"
 *             role_id: 2
 *             is_active: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Cập nhật thông tin người dùng thành công"
 *               data:
 *                 user_id: 1
 *                 full_name: "Nguyễn Văn B (Updated)"
 *                 email: "nguyenvanb@example.com"
 *                 role: "STAFF"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc body rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền hoặc tự hạ role
 *       404:
 *         description: User not found
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validateUserId,
    validate(updateUserSchema),
    updateUserHandler
);

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
