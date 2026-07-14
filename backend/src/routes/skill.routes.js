/**
 * Skill Routes
 *
 * Các endpoint liên quan đến kỹ năng (Skill Management):
 * - GET /: Lấy danh sách kỹ năng (UC34 - View Skill List)
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
import { validate } from "../middlewares/validators/validate.js";
import { getSkillsHandler, createSkillHandler } from "../controllers/skill.controller.js";
import { createSkillSchema } from "../validators/skill.validator.js";

const router = Router();

/**
 * GET /api/v1/skills
 * Lấy danh sách kỹ năng (UC34: View Skill List)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ active skills
 *   - Volunteer/Staff → chỉ active skills
 *   - Manager/Admin → tất cả skills (active + inactive)
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
 *       Endpoint này phục vụ lấy danh sách kỹ năng trong hệ thống
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách skills
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
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
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

export default router;
