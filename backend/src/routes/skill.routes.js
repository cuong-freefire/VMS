/**
 * Skill Routes
 *
 * Các endpoint liên quan đến kỹ năng (Skill Management):
 * - GET /: Lấy danh sách kỹ năng (UC34 - View Skill List)
 * - POST /: Tạo kỹ năng (UC35 - Add Skill)
 * - PATCH /:id: Cập nhật kỹ năng (UC36 - Edit Skill)
 * 
 * Prefix: /api/v1/skills (mount tại app.js)
 *
 * Owner: Member 4 - DucNM
 * Module: Skill Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { validate, validateQuery, validateParams } from "../middlewares/validators/validate.js";
import { getSkillsHandler, createSkillHandler, updateSkillHandler } from "../controllers/skill.controller.js";
import { createSkillSchema, updateSkillSchema, skillIdSchema, getSkillsQuerySchema } from "../middlewares/validators/skill.validator.js";

const router = Router();

/**
 * GET /api/v1/skills
 * Lấy danh sách kỹ năng (UC34: View Skill List)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ active skills
 *   - Volunteer/Staff → chỉ active skills
 *   - Manager/Admin → tất cả skills (active + inactive)
 * Hỗ trợ tìm kiếm theo tên/mô tả (search) (UC-feat-search-skill).
 */
/**
 * @swagger
 * /api/v1/skills:
 *   get:
 *     summary: Lấy danh sách kỹ năng
 *     description: |
 *       Trả về danh sách kỹ năng (skills). Hỗ trợ optional auth:
 *       - Nếu không có token (Guest): trả về skills active (public)
 *       - Nếu có token Volunteer/Staff: trả về skills active
 *       - Nếu có token Manager/Admin: trả về tất cả skills (active + inactive)
 *       Hỗ trợ tìm kiếm theo tên hoặc mô tả (search), phân trang (page, limit) và sắp xếp (sort).
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Số items mỗi trang (tối đa 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mô tả (case-insensitive, partial match)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at:desc
 *         description: Sắp xếp theo field:direction (created_at, updated_at, name — asc/desc)
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách skills kèm phân trang
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách kỹ năng thành công"
 *               data:
 *                 skills:
 *                   - skill_id: 1
 *                     name: "Giao tiếp"
 *                     description: "Kỹ năng giao tiếp hiệu quả"
 *                     is_active: true
 *                     created_at: "2026-07-01T10:00:00.000Z"
 *                     updated_at: "2026-07-01T10:00:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 1
 *                   totalPages: 1
 *       400:
 *         description: Lỗi validation (page, limit, search, sort)
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
    validateQuery(getSkillsQuerySchema),
    getSkillsHandler
);

/**
 * POST /api/v1/skills
 * Tạo kỹ năng mới (UC35: Add Skill)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/skills:
 *   post:
 *     summary: Tạo kỹ năng mới (Manager/Admin only)
 *     description: |
 *       Tạo một kỹ năng mới trong hệ thống.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Tên kỹ năng phải unique — nếu trùng trả về 409.
 *     tags: [Skill Management]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên kỹ năng
 *               description:
 *                 type: string
 *                 description: Mô tả (optional)
 *           example:
 *             name: "Photography"
 *             description: "Kỹ năng chụp ảnh sự kiện"
 *     responses:
 *       201:
 *         description: Tạo skill thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Tạo kỹ năng thành công"
 *               data:
 *                 skill_id: 5
 *                 name: "Photography"
 *                 description: "Kỹ năng chụp ảnh sự kiện"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Skill name already exists
 *       500:
 *         description: Lỗi server
 */
router.post(
    "/",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validate(createSkillSchema),
    createSkillHandler
);

/**
 * PATCH /api/v1/skills/:id
 * Cập nhật kỹ năng (UC36: Edit Skill)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/skills/{id}:
 *   patch:
 *     summary: Cập nhật kỹ năng (Manager/Admin only)
 *     description: |
 *       Cập nhật thông tin kỹ năng theo ID.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Tên mới phải unique — nếu trùng trả về 409.
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của kỹ năng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên kỹ năng
 *               description:
 *                 type: string
 *                 description: Mô tả
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *           example:
 *             name: "Giao tiếp (Updated)"
 *             description: "Kỹ năng giao tiếp cập nhật"
 *             is_active: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Cập nhật kỹ năng thành công"
 *               data:
 *                 skill_id: 1
 *                 name: "Giao tiếp (Updated)"
 *                 description: "Kỹ năng giao tiếp cập nhật"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc body rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Skill not found
 *       409:
 *         description: Skill name already exists
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validateParams(skillIdSchema),
    validate(updateSkillSchema),
    updateSkillHandler
);

export default router;
