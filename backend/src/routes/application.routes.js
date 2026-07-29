/**
 * Application Routes — Endpoints for volunteer applications.
 *
 * Owner: Member 1 - CuongLH
 * Features: UC10 — Submit Application, UC14 — Cancel Application
 */
import { Router } from "express";
import { submitApplicationHandler, cancelApplication } from "../controllers/application.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateParams, validate } from "../middlewares/validators/validate.js";
import {
    cancelApplicationParamsSchema,
    submitApplicationSchema,
} from "../middlewares/validators/application.validator.js";

const router = Router();

/**
 * @swagger
 * /api/v1/applications:
 *   post:
 *     summary: Gửi đơn đăng ký tham gia sự kiện
 *     description: >
 *       Tình nguyện viên gửi đơn đăng ký tham gia một sự kiện.
 *       **Domain Rules**:
 *       - Chỉ VOLUNTEER có tài khoản active mới được đăng ký.
 *       - Sự kiện phải ở trạng thái PUBLISHED và chưa bắt đầu.
 *       - Sự kiện chưa đủ sức chứa (current_participants < max_capacity).
 *       - Mỗi tình nguyện viên chỉ có 1 đơn active cho mỗi sự kiện.
 *     tags:
 *       - Application
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID của sự kiện muốn đăng ký
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: Tin nhắn tùy chọn gửi kèm đơn đăng ký
 *           example:
 *             eventId: 5
 *             message: "Tôi mong muốn được tham gia sự kiện này"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Application'
 *             example:
 *               success: true
 *               message: "Đăng ký sự kiện thành công"
 *               data:
 *                 id: 1
 *                 userId: 3
 *                 eventId: 5
 *                 status: "PENDING"
 *                 message: "Tôi mong muốn được tham gia sự kiện này"
 *                 createdAt: "2026-07-20T08:00:00.000Z"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sự kiện chưa công bố / đã bắt đầu
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
 *         description: Không có quyền (không phải VOLUNTEER)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: >
 *           Sự kiện đã đủ người tham gia, hoặc tình nguyện viên
 *           đã có đơn đăng ký cho sự kiện này
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
router.post(
    "/",
    authMiddleware,
    validate(submitApplicationSchema),
    submitApplicationHandler
);

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
