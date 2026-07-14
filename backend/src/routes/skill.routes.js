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
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { getSkillsHandler } from "../controllers/skill.controller.js";

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

export default router;