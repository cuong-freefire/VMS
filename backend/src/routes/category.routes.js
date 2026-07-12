/**
 * Category Routes
 *
 * Các endpoint liên quan đến danh mục (Category Management):
 * - GET /: Lấy danh sách danh mục (UC31 - View Category List)
 *
 * Prefix: /api/v1/categories (mount tại app.js)
 *
 * Owner: Member 4 - DucNM
 * Module: Category Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { validate } from "../middlewares/validators/validate.js";
import { getCategoriesHandler, createCategoryHandler } from "../controllers/category.controller.js";
import { createCategorySchema } from "../validators/category.validator.js";

const router = Router();

/**
 * GET /api/v1/categories
 * Lấy danh sách danh mục (UC31: View Category List)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ active categories
 *   - Volunteer/Staff → chỉ active categories
 *   - Manager/Admin → tất cả categories (active + inactive)
 */
/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     description: |
 *       Trả về danh sách danh mục (categories). Hỗ trợ optional auth:
 *       - Nếu không có token (Guest): trả về categories active (public)
 *       - Nếu có token Volunteer/Staff: trả về categories active
 *       - Nếu có token Manager/Admin: trả về tất cả categories (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) cho Guest và Volunteer.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách categories
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách danh mục thành công"
 *               data:
 *                 categories:
 *                   - category_id: 1
 *                     name: "Giáo dục"
 *                     type: "event_type"
 *                     is_active: true
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
    getCategoriesHandler
);

/**
 * POST /api/v1/categories
 * Tạo danh mục mới (UC32: Add Category)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Tạo danh mục mới (Manager/Admin only)
 *     description: |
 *       Tạo một danh mục mới trong hệ thống.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Tên category phải unique trong cùng type — nếu trùng trả về 409.
 *       Type phải thuộc: location, event_type, time_frame.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả (optional)
 *               type:
 *                 type: string
 *                 enum: [location, event_type, time_frame]
 *                 description: Loại danh mục
 *           example:
 *             name: "Thể thao"
 *             description: "Các sự kiện thể thao"
 *             type: "event_type"
 *     responses:
 *       201:
 *         description: Tạo category thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Tạo danh mục thành công"
 *               data:
 *                 category_id: 3
 *                 name: "Thể thao"
 *                 type: "event_type"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Category name already exists in this type
 *       500:
 *         description: Lỗi server
 */
router.post(
    "/",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validate(createCategorySchema),
    createCategoryHandler
);

export default router;
