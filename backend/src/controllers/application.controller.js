/**
 * Application Controller - HTTP layer for Application Management module
 * Owner: Member 4 - DucNM (UC22, UC23)
 *
 * Responsibilities:
 * - UC22: Handle GET /api/v1/events/:eventId/applications
 * - UC23: Handle GET /api/v1/applications/:applicationId
 * - Parse request params and pass to Service layer
 * - Return standardized API response
 *
 * Rules:
 * - No business logic in Controller
 * - Always use response.util.js for response format
 */

import applicationService from '../services/application.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

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

export {
    getApplicationsByEventHandler,
    getApplicationDetailHandler
};
