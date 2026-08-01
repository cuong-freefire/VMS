import { Router } from "express";
import eventController from "../controllers/event.controller.js";
import { getByIdParamSchema, listEventsQuerySchema, getEventsQuerySchema, rejectEventSchema, createEventSchema, updateEventSchema } from "../middlewares/validators/event.validator.js";
import { getApplicationsByEventHandler } from "../controllers/application.controller.js";
import { getApplicationsQuerySchema, eventIdParamSchema } from "../middlewares/validators/application.validator.js";
import { validateParams, validateQuery, validate } from "../middlewares/validators/validate.js";
import { authenticateOptional } from "../middlewares/auth.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

/**
 * GET /api/v1/events
 * List published events with pagination, filtering, and sorting.
 * Public endpoint — no authentication required.
 * Volunteer-facing: UC08
 */
router.get(
    "/",
    validateQuery(listEventsQuerySchema),
    eventController.getEvents
);

/**
 * GET /api/v1/events/manage
 * Lấy danh sách sự kiện với role-based visibility và status filter.
 * UC67: Manager/Admin có thể lọc theo status (bao gồm pending_approval).
 * Chỉ Staff/Manager/Admin mới có quyền truy cập.
 */
router.get(
    "/manage",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateQuery(getEventsQuerySchema),
    eventController.getEventsHandler
);

/**
 * GET /api/v1/events/manage/:id
 * Lấy chi tiết sự kiện với role-based visibility.
 * UC68: Manager/Admin có thể xem sự kiện PENDING_APPROVAL.
 * Chỉ Staff/Manager/Admin mới có quyền truy cập.
 */
router.get(
    "/manage/:id",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(getByIdParamSchema),
    eventController.getEventByIdHandler
);

/**
 * GET /api/v1/events/:id
 * Handles both Guest (unauthenticated) and Volunteer (authenticated) requests.
 * Volunteer-facing: UC09
 */
router.get(
    "/:id",
    authenticateOptional,
    validateParams(getByIdParamSchema),
    eventController.getEventById
);

/**
 * POST /api/v1/events
 * UC15: Staff tạo sự kiện mới.
 */
router.post(
    "/",
    authMiddleware,
    authorize("STAFF"),
    validate(createEventSchema),
    eventController.createEventHandler
);

/**
 * PATCH /api/v1/events/:id
 * UC16: Cập nhật thông tin sự kiện.
 * Chỉ Staff — ownership check ở service layer.
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("STAFF"),
    validateParams(getByIdParamSchema),
    validate(updateEventSchema),
    eventController.updateEventHandler
);

/**
 * DELETE /api/v1/events/:id
 * UC17: Xóa (soft delete) sự kiện.
 * Chỉ Staff — ownership check ở service layer.
 */
router.delete(
    "/:id",
    authMiddleware,
    authorize("STAFF"),
    validateParams(getByIdParamSchema),
    eventController.deleteEventHandler
);

/**
 * PATCH /api/v1/events/:id/approve
 * UC69: Phê duyệt sự kiện (Manager/Admin only).
 */
router.patch(
    "/:id/approve",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validateParams(getByIdParamSchema),
    eventController.approveEventHandler
);

/**
 * PATCH /api/v1/events/:id/reject
 * UC70: Từ chối sự kiện (Manager/Admin only).
 */
router.patch(
    "/:id/reject",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validateParams(getByIdParamSchema),
    validate(rejectEventSchema),
    eventController.rejectEventHandler
);

/**
 * GET /api/v1/events/:eventId/applications
 * UC22: Lấy danh sách đơn đăng ký của một sự kiện.
 * Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 */
router.get(
    "/:eventId/applications",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(eventIdParamSchema),
    validateQuery(getApplicationsQuerySchema),
    getApplicationsByEventHandler
);

export default router;
