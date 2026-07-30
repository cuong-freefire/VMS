/**
 * Event Controller — HTTP layer for Event Management module
 * Owner: Member 5 - DucNM (UC15, UC16, UC17, UC67, UC68, UC69, UC70)
 * Owner: Member 1 (CuongLH) — UC08, UC09 (Volunteer-facing event endpoints)
 *
 * Responsibilities:
 * - UC08: List published events (public, volunteer-facing)
 * - UC09: View event detail (public, volunteer-facing)
 * - UC15: Create event
 * - UC16: Update event
 * - UC17: Delete event
 * - UC67: Get event list (role-based)
 * - UC68: Get event detail (role-based)
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

import * as eventService from "../services/event.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

/**
 * GET /api/v1/events
 * List published events with pagination, filtering, and sorting.
 * Public endpoint — no authentication required.
 * Volunteer-facing: UC08
 */
export async function getEvents(req, res, next) {
  try {
    const { page, limit, search, category, sort, isPaid, hasSlots } = req.validatedQuery;

    const result = await eventService.listEvents({
      page,
      limit,
      search,
      category,
      sort,
      isPaid,
      hasSlots,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/events/:id
 * Handles both Guest (unauthenticated) and Volunteer (authenticated) requests.
 * Volunteer-facing: UC09
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

/**
 * GET /api/v1/events (Management)
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
        const { id } = req.validatedParams;
        const result = await eventService.approveEvent(id, req.user);

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
        const { id } = req.validatedParams;
        const result = await eventService.rejectEvent(id, req.body, req.user);

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
        const { id } = req.validatedParams;
        const result = await eventService.updateEvent(id, req.body, req.user);

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
        const { id } = req.validatedParams;
        const result = await eventService.deleteEvent(id, req.user);

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
 * GET /api/v1/events/:id (Management)
 * Lấy chi tiết sự kiện với role-based visibility (UC68).
 * Manager/Admin có thể xem event PENDING_APPROVAL; Staff/Volunteer chỉ xem được event không PENDING_APPROVAL.
 */
async function getEventByIdHandler(req, res, next) {
    try {
        const { id } = req.validatedParams;
        const result = await eventService.getEventById(id, req.user);

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
    getEvents,
    getEventById,
    getEventsHandler,
    approveEventHandler,
    rejectEventHandler,
    createEventHandler,
    updateEventHandler,
    deleteEventHandler,
    getEventByIdHandler
};

export default { getEvents, getEventById, getEventsHandler, approveEventHandler, rejectEventHandler, createEventHandler, updateEventHandler, deleteEventHandler, getEventByIdHandler };