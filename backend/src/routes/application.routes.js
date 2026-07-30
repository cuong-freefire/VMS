/**
 * Application Routes
 *
 * Các endpoint liên quan đến đơn đăng ký (Application):
 * - POST / (UC10 - Submit Application)
 * - PATCH /:id/cancel (UC14 - Cancel Application)
 * - GET /events/:eventId/applications (UC22 - View Application List)
 * - GET /:applicationId (UC23 - View Application Detail)
 * - PATCH /:applicationId/approve (UC24 - Approve Application)
 * - PATCH /:applicationId/reject (UC25 - Reject Application)
 *
 * Prefix: /api/v1/applications (mount tại app.js)
 *
 * Owner: Member 1 - CuongLH (UC10, UC14)
 * Owner: Member 4 - DucNM (UC22, UC23, UC24, UC25)
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { validate, validateQuery, validateParams } from "../middlewares/validators/validate.js";
import { submitApplicationHandler, cancelApplication, getApplicationDetailHandler, approveApplicationHandler, rejectApplicationHandler } from "../controllers/application.controller.js";
import { submitApplicationSchema, cancelApplicationParamsSchema, applicationIdParamSchema, rejectApplicationSchema } from "../middlewares/validators/application.validator.js";

const router = Router();

/**
 * POST /api/v1/applications
 * UC10: Tình nguyện viên gửi đơn đăng ký tham gia sự kiện.
 */
router.post(
    "/",
    authMiddleware,
    validate(submitApplicationSchema),
    submitApplicationHandler
);

/**
 * PATCH /api/v1/applications/:id/cancel
 * UC14: Tình nguyện viên tự hủy đơn đăng ký.
 */
router.patch(
    "/:id/cancel",
    authMiddleware,
    validateParams(cancelApplicationParamsSchema),
    cancelApplication
);

/**
 * GET /api/v1/applications/:applicationId
 * UC23: Lấy chi tiết đơn đăng ký.
 * Chỉ Staff (chủ sở hữu event) mới có quyền xem.
 */
router.get(
    "/:applicationId",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(applicationIdParamSchema),
    getApplicationDetailHandler
);

/**
 * PATCH /api/v1/applications/:applicationId/approve
 * UC24: Phê duyệt đơn đăng ký.
 * Chỉ Staff (chủ sở hữu event) mới có quyền.
 */
router.patch(
    "/:applicationId/approve",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(applicationIdParamSchema),
    approveApplicationHandler
);

/**
 * PATCH /api/v1/applications/:applicationId/reject
 * UC25: Từ chối đơn đăng ký kèm lý do.
 * Chỉ Staff (chủ sở hữu event) mới có quyền.
 */
router.patch(
    "/:applicationId/reject",
    authMiddleware,
    authorize("STAFF", "MANAGER", "ADMIN"),
    validateParams(applicationIdParamSchema),
    validate(rejectApplicationSchema),
    rejectApplicationHandler
);

export default router;