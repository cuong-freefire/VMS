/**
 * Application Controller - HTTP layer for Application Management module
 * Owner: Member 4 - DucNM (UC22)
 *
 * Responsibilities:
 * - UC22: Handle GET /api/v1/events/:eventId/applications
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
        const eventId = parseInt(req.params.eventId, 10);

        if (Number.isNaN(eventId)) {
            return res.status(400).json(
                errorResponse(
                    'Event ID không hợp lệ',
                    'VALIDATION_ERROR'
                )
            );
        }

        const query = req.validatedQuery || req.query;
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

export {
    getApplicationsByEventHandler
};