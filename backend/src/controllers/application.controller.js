/**
 * Application Controller — HTTP layer for application endpoints.
 *
 * Handles UC10 — Submit Application, UC14 — Cancel Application (Volunteer-facing)
 * Handles UC22 — View Application List, UC23 — View Application Detail,
 *          UC24 — Approve Application, UC25 — Reject Application (Staff-facing)
 *
 * Owner: Member 1 - CuongLH (UC10, UC14)
 * Owner: Member 4 - DucNM (UC22, UC23, UC24, UC25)
 */

import { submitApplication, cancelUserApplication } from "../services/application.service.js";
import applicationService from '../services/application.service.js';
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

/**
 * GET /api/v1/events/:eventId/applications
 * Lấy danh sách đơn đăng ký của một sự kiện (UC22).
 * Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 * Hỗ trợ phân trang và lọc theo status.
 */
async function getApplicationsByEventHandler(req, res, next) {
    try {
        const eventId = Number(req.validatedParams.eventId);

        const query = req.validatedQuery;
        const result = await applicationService.getApplicationsByEvent(eventId, query, req.user);

        const message = result.applications.length > 0
            ? 'Lấy danh sách thành công'
            : 'Không có đơn đăng ký nào.';

        return res.status(200).json(
            successResponse(result, message)
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * GET /api/v1/applications/:applicationId
 * Lấy chi tiết đơn đăng ký (UC23).
 * Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 */
async function getApplicationDetailHandler(req, res, next) {
    try {
        const applicationId = Number(req.validatedParams.applicationId);
        const result = await applicationService.getApplicationDetail(applicationId, req.user);

        return res.status(200).json(
            successResponse(result, 'Lấy chi tiết đơn đăng ký thành công')
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * PATCH /api/v1/applications/:applicationId/approve
 * Phê duyệt đơn đăng ký (UC24).
 * Chỉ Staff (chủ sở hữu event) mới có quyền.
 */
async function approveApplicationHandler(req, res, next) {
    try {
        const applicationId = Number(req.validatedParams.applicationId);
        const result = await applicationService.approveApplication(applicationId, req.user);

        return res.status(200).json(
            successResponse(result, 'Phê duyệt đơn đăng ký thành công')
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * PATCH /api/v1/applications/:applicationId/reject
 * Từ chối đơn đăng ký (UC25).
 * Chỉ Staff (chủ sở hữu event) mới có quyền.
 */
async function rejectApplicationHandler(req, res, next) {
    try {
        const applicationId = Number(req.validatedParams.applicationId);
        const result = await applicationService.rejectApplication(applicationId, req.body, req.user);

        return res.status(200).json(
            successResponse(result, 'Từ chối đơn đăng ký thành công')
        );
    } catch (error) {
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

export {
    submitApplicationHandler,
    cancelApplication,
    getApplicationsByEventHandler,
    getApplicationDetailHandler,
    approveApplicationHandler,
    rejectApplicationHandler
};

export default { submitApplicationHandler, cancelApplication, getApplicationsByEventHandler, getApplicationDetailHandler, approveApplicationHandler, rejectApplicationHandler };