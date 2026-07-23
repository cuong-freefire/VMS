/**
 * Event Routes
 *
 * Các endpoint liên quan đến sự kiện (Event Management):
 * - POST / (UC15 - Add Event)
 * - GET / (UC67 - View Pending Event)
 * - PATCH /:id/approve (UC69)
 * - PATCH /:id/reject (UC70)
 *
 * Prefix: /api/v1/events (mount tại app.js)
 *
 * Owner: Member 5 - DucNM (UC15, UC67, UC69, UC70)
 * Module: Event Approval Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { validate, validateQuery } from "../middlewares/validators/validate.js";
import { getEventsHandler, approveEventHandler, rejectEventHandler, createEventHandler, updateEventHandler } from "../controllers/event.controller.js";
import { getEventsQuerySchema, rejectEventSchema, createEventSchema, updateEventSchema } from "../middlewares/validators/event.validator.js";

const router = Router();

/**
 * GET /api/v1/events
 * Lấy danh sách sự kiện (UC67: View Pending Event)
 * Hỗ trợ optional auth:
 *   - Guest (không token) → chỉ PUBLISHED events
 *   - Volunteer/Staff → chỉ PUBLISHED events
 *   - Manager/Admin → tất cả events; có thể lọc status=pending_approval
 */
/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Lấy danh sách sự kiện
 *     description: |
 *       Trả về danh sách sự kiện với phân trang và lọc theo status.
 *       Hỗ trợ optional auth:
 *       - Guest (không token): chỉ PUBLISHED events
 *       - Volunteer/Staff: chỉ PUBLISHED events
 *       - Manager/Admin: tất cả events; có thể lọc status=pending_approval
 *       Chỉ Manager/Admin mới có quyền xem PENDING_APPROVAL events.
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số items mỗi trang (max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, published, rejected, in_progress, completed, cancelled]
 *         description: Lọc theo trạng thái sự kiện
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách sự kiện
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách sự kiện thành công"
 *               data:
 *                 events:
 *                   - event_id: 1
 *                     title: "Dọn dẹp bãi biển"
 *                     status: "pending_approval"
 *                     created_at: "2026-06-15T08:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 3
 *                   totalPages: 1
 *       400:
 *         description: Lỗi validation (page, limit, status)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (Staff/Volunteer xem pending_approval)
 *       500:
 *         description: Lỗi server
 */
router.get(
    "/",
    optionalAuth,
    validateQuery(getEventsQuerySchema),
    getEventsHandler
);

/**
 * PATCH /api/v1/events/:id/approve
 * Phê duyệt sự kiện (UC69: Approve Event)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/events/{id}/approve:
 *   patch:
 *     summary: Phê duyệt sự kiện (Manager/Admin only)
 *     description: |
 *       Phê duyệt một sự kiện đang chờ duyệt (PENDING_APPROVAL).
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Event phải có status = PENDING_APPROVAL — nếu không trả về 409.
 *       Sau khi phê duyệt, event chuyển sang status PUBLISHED.
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Phê duyệt sự kiện thành công"
 *               data:
 *                 event_id: 1
 *                 title: "Dọn dẹp bãi biển"
 *                 status: "published"
 *                 approved_by: 2
 *                 approved_at: "2026-07-01T10:00:00.000Z"
 *       400:
 *         description: Event ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Manager/Admin)
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event is not in PENDING status
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id/approve",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    approveEventHandler
);

/**
 * PATCH /api/v1/events/:id/reject
 * Từ chối sự kiện (UC70: Reject Event)
 * Chỉ Manager/Admin mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/events/{id}/reject:
 *   patch:
 *     summary: Từ chối sự kiện (Manager/Admin only)
 *     description: |
 *       Từ chối một sự kiện đang chờ duyệt (PENDING_APPROVAL) kèm lý do.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Staff/Volunteer nhận 403. Guest nhận 401.
 *       Event phải có status = PENDING_APPROVAL — nếu không trả về 409.
 *       rejection_reason là bắt buộc, tối thiểu 10 ký tự.
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejection_reason
 *             properties:
 *               rejection_reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Lý do từ chối (tối thiểu 10 ký tự)
 *           example:
 *             rejection_reason: "Thông tin sự kiện chưa đầy đủ và cần bổ sung thêm chi tiết."
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Từ chối sự kiện thành công"
 *               data:
 *                 event_id: 1
 *                 title: "Dọn dẹp bãi biển"
 *                 status: "rejected"
 *                 rejected_by: 2
 *                 rejected_at: "2026-07-01T10:30:00.000Z"
 *                 rejection_reason: "Thông tin sự kiện chưa đầy đủ và cần bổ sung thêm chi tiết."
 *       400:
 *         description: Dữ liệu không hợp lệ (rejection_reason thiếu hoặc quá ngắn)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Manager/Admin)
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event is not in PENDING status
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id/reject",
    authMiddleware,
    authorize("MANAGER", "ADMIN"),
    validate(rejectEventSchema),
    rejectEventHandler
);

/**
 * POST /api/v1/events
 * Tạo sự kiện mới (UC15: Add Event)
 * Chỉ Staff mới có quyền truy cập.
 */
/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Tạo sự kiện mới (Staff only)
 *     description: |
 *       Tạo một sự kiện tình nguyện mới với trạng thái DRAFT.
 *       Chỉ Staff mới có quyền truy cập.
 *       createdBy được lấy từ JWT token — không tin request body.
 *       Sau khi tạo, event ở trạng thái DRAFT chờ Staff submit để chuyển sang PENDING_APPROVAL.
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *               - applicationDeadline
 *               - location
 *               - maxCapacity
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Tiêu đề sự kiện
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 5000
 *                 description: Mô tả chi tiết sự kiện
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày giờ bắt đầu (ISO 8601, phải ở tương lai)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày giờ kết thúc (ISO 8601, phải sau startDate)
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *                 description: Hạn đăng ký (ISO 8601, phải trước startDate)
 *               location:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Địa điểm tổ chức
 *               maxCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: Số lượng tối đa
 *               categoryId:
 *                 type: integer
 *                 description: ID danh mục sự kiện (FK -> event_categories.id)
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh bìa từ Cloudinary (tùy chọn)
 *           example:
 *             title: "Mùa Hè Xanh 2026 - Hà Giang"
 *             description: "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc. Tình nguyện viên sẽ tham gia các hoạt động xây dựng trường học, dạy học cho trẻ em vùng cao và hỗ trợ cộng đồng địa phương."
 *             startDate: "2026-07-15T08:00:00.000Z"
 *             endDate: "2026-07-20T17:00:00.000Z"
 *             applicationDeadline: "2026-07-10T23:59:59.000Z"
 *             location: "Hà Giang, Việt Nam"
 *             maxCapacity: 50
 *             categoryId: 1
 *             imageUrl: "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg"
 *     responses:
 *       201:
 *         description: Tạo sự kiện thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Tạo sự kiện thành công"
 *               data:
 *                 event_id: 123
 *                 title: "Mùa Hè Xanh 2026 - Hà Giang"
 *                 description: "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc..."
 *                 location: "Hà Giang, Việt Nam"

 *                 start_date: "2026-07-15T08:00:00.000Z"
 *                 end_date: "2026-07-20T17:00:00.000Z"
 *                 application_deadline: "2026-07-10T23:59:59.000Z"
 *                 max_capacity: 50
 *                 approved_participants: 0
 * 
 *                 image_url: "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg"
 *
 *                 status: "draft"
 *                 is_active: true
 *
 *                 created_at: "2026-06-29T15:09:00.000Z"
 *                 updated_at: "2026-06-29T15:09:00.000Z"
 *
 *                 category:
 *                     id: 1
 *                     name: "Community"
 *                     type: "volunteer"
 *
 *                 created_by:
 *                     id: 456
 *                     full_name: "Nguyen Van A"
 *                     email: "staff@example.com"
 *       400:
 *         description: Dữ liệu không hợp lệ (validation error)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Staff)
 *       500:
 *         description: Lỗi server
 */
router.post(
    "/",
    authMiddleware,
    authorize("STAFF"),
    validate(createEventSchema),
    createEventHandler
);

/**
 * PATCH /api/v1/events/:id
 * Cập nhật thông tin sự kiện (UC16: Edit Event)
 * Chỉ Staff — ownership check ở service layer.
 */
/**
 * @swagger
 * /api/v1/events/{id}:
 *   patch:
 *     summary: Cập nhật thông tin sự kiện
 *     description: |
 *       Cập nhật thông tin sự kiện. Tất cả các field đều optional (PATCH semantics).
 *       Chỉ Staff là người tạo event mới có quyền chỉnh sửa.
 *       - DRAFT/PENDING_APPROVAL/REJECTED: có thể chỉnh sửa
 *       - PUBLISHED: 
 *          - Nếu sửa CRITICAL fields -> chuyển về PENDING_APPROVAL 
 *          - Nếu chỉ sửa SAFE fields -> giữ nguyên PUBLISHED
 *       - IN_PROGRESS/COMPLETED/CANCELLED: không thể chỉnh sửa (409)
 *       Không thể giảm maxCapacity dưới approvedParticipants (409).
 *     tags: [Event Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Tiêu đề sự kiện (CRITICAL → reset status)
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 5000
 *                 description: Mô tả chi tiết (SAFE)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày giờ bắt đầu (CRITICAL → reset status)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày giờ kết thúc (CRITICAL → reset status)
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *                 description: Hạn đăng ký (CONDITIONAL)
 *               location:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Địa điểm (CRITICAL → reset status)
 *               maxCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: Số lượng tối đa (CONDITIONAL, >= approvedParticipants)
 *               categoryId:
 *                 type: integer
 *                 description: ID danh mục (CRITICAL → reset status)
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh bìa (SAFE)
 *           example:
 *             title: "Mùa Hè Xanh 2026 - Cập nhật"
 *             description: "Chiến dịch tình nguyện mùa hè đã được cập nhật với thông tin mới. Tình nguyện viên sẽ tham gia các hoạt động xây dựng trường học và dạy học cho trẻ em."
 *             maxCapacity: 60
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Cập nhật sự kiện thành công"
 *               data:
 *                 event_id: 123
 *                 title: "Mùa Hè Xanh 2026 - Cập nhật"
 *                 description: "..."
 *                 location: "Hà Nội"
 *                 start_date: "2026-08-01T08:00:00.000Z"
 *                 end_date: "2026-08-05T17:00:00.000Z"
 *                 application_deadline: "2026-07-25T23:59:59.000Z"
 *                 max_capacity: 60
 *                 approved_participants: 20
 *                 image_url: "https://..."
 *                 status: "pending_approval"
 *                 is_active: true
 *                 created_at: "2026-07-01T10:00:00.000Z"
 *                 updated_at: "2026-07-18T10:00:00.000Z"
 *       400:
 *         description: Dữ liệu không hợp lệ (validation error)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải chủ sở hữu)
 *       404:
 *         description: Event not found
 *       409:
 *         description: Conflict (status not editable hoặc capacity invalid)
 *       500:
 *         description: Lỗi server
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("STAFF"),
    validate(updateEventSchema),
    updateEventHandler
);

export default router;
