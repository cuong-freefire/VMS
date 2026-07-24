/**
 * Application Routes
 *
 * Các endpoint liên quan đến đơn đăng ký (Application Management):
  * - GET /events/:eventId/applications
 *   UC22 - View Application List
 *
 * - GET /applications/:applicationId
 *   UC23 - View Application Detail
 * 
 * Prefix: /api/v1 (mount tại app.js)
 *
 * Owner: Member 4 - DucNM (UC22)
 * Module: Application Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { validateQuery, validateParams } from "../middlewares/validators/validate.js";
import { getApplicationsByEventHandler, getApplicationDetailHandler } from "../controllers/application.controller.js";
import { getApplicationsQuerySchema, applicationIdParamSchema, eventIdParamSchema } from "../middlewares/validators/application.validator.js";

const router = Router();

/**
 * GET /api/v1/events/:eventId/applications
 * Lấy danh sách đơn đăng ký của một sự kiện (UC22: View Application List)
 * Chỉ Staff là chủ sở hữu của event mới được xem danh sách đơn đăng ký.
 */
/**
 * @swagger
 * /api/v1/events/{eventId}/applications:
 *   get:
 *     summary: Lấy danh sách đơn đăng ký của sự kiện
 *     description: |
 *       Trả về danh sách đơn đăng ký của một sự kiện với phân trang và lọc theo status.
 *       Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 *       Hỗ trợ phân trang (page, limit) và lọc theo status.
 *     tags: [Application Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
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
 *           enum: [pending, approved, rejected, cancelled]
 *         description: Lọc theo trạng thái đơn đăng ký
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách đơn đăng ký
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách thành công"
 *               data:
 *                 applications:
 *                   - id: 1
 *                     userId: 5
 *                     eventId: 10
 *                     status: "PENDING"
 *                     message: null
 *                     processedBy: null
 *                     processedAt: null
 *                     createdAt: "2026-06-15T10:30:00.000Z"
 *                     updatedAt: "2026-06-15T10:30:00.000Z"
 *                     volunteer:
 *                       id: 5
 *                       fullName: "Nguyễn Văn A"
 *                       avatarUrl: "https://res.cloudinary.com/..."
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 87
 *                   totalPages: 5
 *       400:
 *         description: Lỗi validation (status, page, limit)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải chủ sở hữu event)
 *       404:
 *         description: Event not found
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/events/:eventId/applications",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(eventIdParamSchema),
    validateQuery(getApplicationsQuerySchema),
    getApplicationsByEventHandler
);

/**
 * GET /api/v1/applications/:applicationId
 * Lấy chi tiết đơn đăng ký (UC23: View Application Detail)
 * Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 */
/**
 * @swagger
 * /api/v1/applications/{applicationId}:
 *   get:
 *     summary: Lấy chi tiết đơn đăng ký
 *     description: |
 *       Trả về chi tiết đơn đăng ký kèm thông tin volunteer (họ tên, email, SĐT, ảnh, kỹ năng) và thông tin sự kiện.
 *       Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 *     tags: [Application Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn đăng ký
 *     responses:
 *       200:
 *         description: Thành công, trả về chi tiết đơn đăng ký
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy chi tiết đơn đăng ký thành công"
 *               data:
 *                 id: 1
 *                 userId: 5
 *                 eventId: 10
 *                 status: "PENDING"
 *                 message: "Tôi muốn tham gia sự kiện này..."
 *                 processedBy: null
 *                 processedAt: null
 *                 createdAt: "2026-06-15T10:30:00.000Z"
 *                 updatedAt: "2026-06-15T10:30:00.000Z"
 *                 volunteer:
 *                   id: 5
 *                   fullName: "Nguyễn Văn A"
 *                   email: "nguyenvana@example.com"
 *                   phone: "+84901234567"
 *                   avatarUrl: "https://res.cloudinary.com/..."
 *                   skills:
 *                     - id: 1
 *                       name: "First Aid"
 *                     - id: 2
 *                       name: "Communication"
 *                 event:
 *                   id: 10
 *                   title: "Mùa Hè Xanh 2026"
 *                   startDate: "2026-07-15T08:00:00.000Z"
 *                   endDate: "2026-07-20T17:00:00.000Z"
 *       400:
 *         description: Application ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải chủ sở hữu event)
 *       404:
 *         description: Application not found
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/applications/:applicationId",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(applicationIdParamSchema),
    getApplicationDetailHandler
);

export default router;
