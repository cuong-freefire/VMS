/**
 * Application Controller — HTTP layer for application endpoints.
 *
 * Handles UC10 — Submit Application & UC14 — Cancel Application.
 *
 * Owner: Member 1 - CuongLH
 */

import { submitApplication, cancelUserApplication } from "../services/application.service.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

/**
 * POST /api/v1/applications
 *
 * Tình nguyện viên gửi đơn đăng ký tham gia sự kiện.
 * Body: { eventId, message? }
 */
export async function submitApplicationHandler(req, res) {
  try {
    const { user_id, role_name: role } = req.user;
    const { eventId, message } = req.body;

    const application = await submitApplication(user_id, role, eventId, message);

    return res
      .status(201)
      .json(successResponse(application, "Đăng ký sự kiện thành công"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR")
      );
  }
}

/**
 * PATCH /api/v1/applications/:id/cancel
 *
 * Tình nguyện viên tự hủy đơn đăng ký trước khi sự kiện bắt đầu.
 * Chỉ hủy được đơn ở trạng thái PENDING hoặc APPROVED.
 */
export async function cancelApplication(req, res) {
  try {
    const { user_id } = req.user;
    const { id } = req.validatedParams;

    const cancelled = await cancelUserApplication(id, user_id);

    return res
      .status(200)
      .json(successResponse(cancelled, "Hủy đơn đăng ký thành công"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR")
      );
  }
}

export default { submitApplicationHandler, cancelApplication };
