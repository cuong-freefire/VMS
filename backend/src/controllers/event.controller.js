/**
 * Event Controller - HTTP layer for Event Management module
 * Owner: Member 5 - DucNM (UC15, UC16, UC17, UC67, UC68, UC69, UC70)
 *
 * Responsibilities:
 * - UC15: Create event
 * - UC16: Update event
 * - UC17: Delete event
 * - UC67: Get event list
 * - UC68: Get event detail
 * - UC69: Approve event
 * - UC70: Reject event
 * - Handle HTTP request/response
 * - Return standardized API response
 *
 * Rules:
 * - Parse HTTP request and delegate business logic to Service layer
 * - Authentication/Authorization is handled by middleware and Service layer
 * - Always use response.util.js for response format
 */

import eventService from '../services/event.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * GET /api/v1/events
 * Lấy danh sách sự kiện với role-based visibility và status filter.
 * UC67: Manager/Admin có thể lọc theo status=pending_approval.
 * - Guest/Volunteer → chỉ thấy PUBLISHED events
 * - Staff → thấy PUBLISHED events và các sự kiện do mình tạo
 * - Manager/Admin → thấy tất cả events, có thể lọc theo status (bao gồm pending_approval)
 */
async function getEventsHandler(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await eventService.getEvents(query, req.user);

        const message = result.events.length > 0
            ? 'Lấy danh sách sự kiện thành công'
            : 'Không có sự kiện nào';

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
 * PATCH /api/v1/events/:id/approve
 * Phê duyệt sự kiện PENDING_APPROVAL (UC69).
 * Authentication/Authorization được xử lý ở middleware.
 */
async function approveEventHandler(req, res, next) {
    try {
        const eventId = parseInt(req.params.id, 10);
        const result = await eventService.approveEvent(eventId, req.user);

        return res.status(200).json(
            successResponse(result, 'Phê duyệt sự kiện thành công')
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
 * PATCH /api/v1/events/:id/reject
 * Từ chối sự kiện PENDING_APPROVAL kèm lý do (UC70).
 * Chỉ Manager/Admin mới có quyền (kiểm tra ở middleware).
 */
async function rejectEventHandler(req, res, next) {
    try {
        const eventId = parseInt(req.params.id, 10);
        const result = await eventService.rejectEvent(eventId, req.body, req.user);

        return res.status(200).json(
            successResponse(result, 'Từ chối sự kiện thành công')
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
 * POST /api/v1/events
 * UC15: Staff tạo sự kiện mới.
 * Authentication và Authorization được xử lý ở middleware.
 */
async function createEventHandler(req, res, next) {
    try {
        const result = await eventService.createEvent(req.body, req.user);

        return res.status(201).json(
            successResponse(result, 'Tạo sự kiện thành công')
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
 * PATCH /api/v1/events/:id
 * Cập nhật thông tin sự kiện (UC16).
 * Chỉ Staff (chủ sở hữu) mới có quyền (kiểm tra ở service layer).
 */
async function updateEventHandler(req, res, next) {
    try {
        const eventId = parseInt(req.params.id, 10);
        const result = await eventService.updateEvent(eventId, req.body, req.user);

        return res.status(200).json(
            successResponse(result, 'Cập nhật sự kiện thành công')
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
 * DELETE /api/v1/events/:id
 * Xóa (soft delete) sự kiện (UC17).
 * Chỉ Staff (chủ sở hữu) mới có quyền (kiểm tra ở service layer).
 */
async function deleteEventHandler(req, res, next) {
    try {
        const eventId = parseInt(req.params.id, 10);
        const result = await eventService.deleteEvent(eventId, req.user);

        return res.status(200).json(
            successResponse(result, 'Xóa sự kiện thành công')
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
 * GET /api/v1/events/:id
 * Lấy chi tiết sự kiện với role-based visibility (UC68).
 * Manager/Admin có thể xem event PENDING_APPROVAL; Staff/Volunteer chỉ xem được event không PENDING_APPROVAL.
 */
async function getEventByIdHandler(req, res, next) {
    try {
        const eventId = parseInt(req.params.id, 10);
        const result = await eventService.getEventById(eventId, req.user);

        return res.status(200).json(
            successResponse(result, 'Lấy thông tin sự kiện thành công')
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
    getEventsHandler,
    approveEventHandler,
    rejectEventHandler,
    createEventHandler,
    updateEventHandler,
    deleteEventHandler,
    getEventByIdHandler
};
