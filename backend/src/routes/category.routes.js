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
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { getCategoriesHandler } from "../controllers/category.controller.js";

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

export default router;