/**
 * Category Routes
 *
 * Các endpoint liên quan đến danh mục (Category Management):
 * - GET /: Lấy danh sách danh mục (UC31 - View Category List, UC-feat-search-category)
 * - POST /       : Add Category (UC32)
 * - PATCH /:id   : Edit Category (UC33)
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
import { validate, validateQuery, validateParams } from "../middlewares/validators/validate.js";
import { getCategoriesHandler, createCategoryHandler, updateCategoryHandler } from "../controllers/category.controller.js";
import { createCategorySchema, updateCategorySchema, categoryIdSchema, getCategoriesQuerySchema } from "../middlewares/validators/category.validator.js";

const router = Router();

/**
 * GET /api/v1/categories
 * Lấy danh sách danh mục (UC31: View Category List)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ active categories
 *   - Volunteer/Staff → chỉ active categories
 *   - Manager/Admin → tất cả categories (active + inactive)
 * Hỗ trợ tìm kiếm theo tên/mô tả (search) và lọc theo type (UC-feat-search-category).
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
 *       Hỗ trợ tìm kiếm theo tên/mô tả (search) và lọc theo type.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mô tả (case-insensitive, partial match)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [location, event_type, time_frame]
 *         description: Lọc theo loại danh mục
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
 *                     description: "Các sự kiện giáo dục"
 *                     type: "event_type"
 *                     is_active: true
 *       400:
 *         description: Lỗi validation (search, type)
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
    validateQuery(getCategoriesQuerySchema),
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
 *                 description: "Các sự kiện thể thao"
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

/**
 * PATCH /api/v1/categories/:id
 * Cập nhật danh mục (UC33: Edit Category)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Cập nhật danh mục (Manager/Admin only)
 *     description: |
 *       Cập nhật thông tin danh mục theo ID.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Type không thể thay đổi (bất biến).
 *       Tên mới phải unique trong cùng type — nếu trùng trả về 409.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *           example:
 *             name: "Giáo dục (Updated)"
 *             description: "Các sự kiện giáo dục cập nhật"
 *             is_active: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Cập nhật danh mục thành công"
 *               data:
 *                 category_id: 1
 *                 name: "Giáo dục (Updated)"
 *                 description: "Các sự kiện giáo dục cập nhật"
 *                 type: "event_type"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc body rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists in this type
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validateParams(categoryIdSchema),
    validate(updateCategorySchema),
    updateCategoryHandler
);

export default router;
