/**
 * Event Routes
 *
 * Các endpoint liên quan đến sự kiện (Event Management):
 * - GET /: Lấy danh sách sự kiện (UC67 - View Pending Event)
 * - PATCH /:id/approve: Phê duyệt sự kiện (UC69 - Approve Event)
 *
 * Prefix: /api/v1/events (mount tại app.js)
 *
 * Owner: Member 5 - DucNM
 * Module: Event Approval Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { validateQuery } from "../middlewares/validators/validate.js";
import { getEventsHandler, approveEventHandler } from "../controllers/event.controller.js";
import { getEventsQuerySchema } from "../middlewares/validators/event.validator.js";

const router = Router();

/**
 * GET /api/v1/events
 * Lấy danh sách sự kiện (UC67: View Pending Event)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ PUBLISHED events
 *   - Volunteer/Staff → chỉ PUBLISHED events
 *   - Manager/Admin → tất cả events; có thể lọc status=pending_approval
 */
/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Lấy danh sách sự kiện
 *     description: |
 *       Trả về danh sách sự kiện với phân trang và lọc theo status.
 *       Hỗ trợ optional auth:
 *       - Guest (không token): chỉ PUBLISHED events
 *       - Volunteer/Staff: chỉ PUBLISHED events
 *       - Manager/Admin: tất cả events; có thể lọc status=pending_approval
 *       Chỉ Manager/Admin mới có quyền xem PENDING_APPROVAL events.
 *     tags: [Event Management]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, published, rejected, in_progress, completed, cancelled]
 *         description: Lọc theo trạng thái sự kiện
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách sự kiện
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách sự kiện thành công"
 *               data:
 *                 events:
 *                   - event_id: 1
 *                     title: "Dọn dẹp bãi biển"
 *                     status: "pending_approval"
 *                     created_at: "2026-06-15T08:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 3
 *                   totalPages: 1
 *       400:
 *         description: Lỗi validation (page, limit, status)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (Staff/Volunteer xem pending_approval)
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
    validateQuery(getEventsQuerySchema),
    getEventsHandler
);

/**
 * PATCH /api/v1/events/:id/approve
 * Phê duyệt sự kiện (UC69: Approve Event)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/events/{id}/approve:
 *   patch:
 *     summary: Phê duyệt sự kiện (Manager/Admin only)
 *     description: |
 *       Phê duyệt một sự kiện đang chờ duyệt (PENDING_APPROVAL).
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Event phải có status = PENDING_APPROVAL — nếu không trả về 409.
 *       Sau khi phê duyệt, event chuyển sang status PUBLISHED.
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Phê duyệt sự kiện thành công"
 *               data:
 *                 event_id: 1
 *                 title: "Dọn dẹp bãi biển"
 *                 status: "published"
 *                 approved_by: 2
 *                 approved_at: "2026-07-01T10:00:00.000Z"
 *       400:
 *         description: Event ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Manager/Admin)
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event is not in PENDING_APPROVAL status
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id/approve",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    approveEventHandler
);

export default router;