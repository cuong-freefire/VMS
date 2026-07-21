/**
 * Event Controller — View Event Detail (UC09)
 * Owner: Member 1 (CuongLH)
 *
 * Endpoint: GET /api/v1/events/:id
 * Handles both Guest (unauthenticated) and Volunteer (authenticated) requests.
 */

import * as eventService from "../services/event.service.js";

/**
 * GET /api/v1/events/:id
 *
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Lấy chi tiết sự kiện
 *     description: >
 *       Trả về thông tin chi tiết của một sự kiện.
 *       Hỗ trợ cả Guest (không đăng nhập) và Volunteer (đã đăng nhập).
 *       Nếu đã đăng nhập, response kèm thông tin đơn đăng ký của người dùng (nếu có).
 *     tags: [Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện (số nguyên dương)
 *         example: 1
 *     responses:
 *       200:
 *         description: Chi tiết sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventDetailDTO'
 *       400:
 *         description: ID không hợp lệ (không phải số nguyên dương)
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
 *       500:
 *         description: Lỗi máy chủ nội bộ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function getEventById(req, res, next) {
  try {
    const { id } = req.validatedParams;
    const userId = req.user?.user_id ?? null;

    const eventDetail = await eventService.getEventDetail(id, userId);

    return res.status(200).json({
      success: true,
      data: eventDetail,
    });
  } catch (error) {
    next(error);
  }
}

export default { getEventById };
