/**
 * Application Routes — Endpoints for volunteer applications.
 *
 * Owner: Member 1 - CuongLH
 * Feature: UC14 — Cancel Application
 */
import { Router } from "express";
import { cancelApplication } from "../controllers/application.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateParams } from "../middlewares/validators/validate.js";
import { cancelApplicationParamsSchema } from "../middlewares/validators/application.validator.js";

const router = Router();

/**
 * @swagger
 * /api/v1/applications/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn đăng ký sự kiện
 *     description: >
 *       Tình nguyện viên tự hủy đơn đăng ký của chính mình trước khi sự kiện bắt đầu.
 *       **Domain Rules**:
 *       - Chỉ hủy được đơn ở trạng thái PENDING hoặc APPROVED.
 *       - Không hủy được khi sự kiện đang diễn ra hoặc đã kết thúc.
 *       - Đơn đã REJECTED hoặc CANCELLED không hủy lại được.
 *       - Khi hủy đơn APPROVED, số lượng approved_participants của sự kiện giảm 1.
 *     tags:
 *       - Application
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của đơn đăng ký
 *     responses:
 *       200:
 *         description: Hủy đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_CancelApplication'
 *             example:
 *               success: true
 *               message: "Hủy đơn đăng ký thành công"
 *               data:
 *                 id: 1
 *                 userId: 3
 *                 eventId: 5
 *                 status: "CANCELLED"
 *                 createdAt: "2026-07-20T08:00:00.000Z"
 *                 updatedAt: "2026-07-22T01:59:17.000Z"
 *       400:
 *         description: ID không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền hủy (không phải chủ đơn)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy đơn đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: >
 *           Không thể hủy — đơn đã bị REJECTED / CANCELLED trước đó,
 *           hoặc sự kiện đang diễn ra / đã kết thúc.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
    "/:id/cancel",
    authMiddleware,
    validateParams(cancelApplicationParamsSchema),
    cancelApplication
);

export default router;
