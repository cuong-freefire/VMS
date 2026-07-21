import { Router } from "express";
import eventController from "../controllers/event.controller.js";
import { getByIdParamSchema } from "../middlewares/validators/event.validator.js";
import { validateParams } from "../middlewares/validators/validate.js";
import { authenticateOptional } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Xem chi tiết sự kiện
 *     description: |
 *       Endpoint công khai cho phép Guest (không đăng nhập) và Volunteer (đã đăng nhập) xem chi tiết sự kiện.
 *
 *       **Phân biệt Guest vs Volunteer:**
 *       - Guest / không có JWT cookie → `userApplication: null`
 *       - Volunteer đã đăng nhập → trả thêm thông tin đơn đăng ký của chính user đó (nếu có)
 *
 *       **Business Rules:**
 *       - Chỉ hiển thị event có `isActive = true`
 *       - Chỉ hiển thị event có `status IN ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED']`
 *       - Tất cả tình huống không tìm thấy event đều trả về 404 (zero information disclosure)
 *     tags:
 *       - Events
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của sự kiện (số nguyên dương)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     security: []
 *     responses:
 *       200:
 *         description: |
 *           Thành công. Response khác nhau tùy theo Guest hay Volunteer.
 *
 *           **Guest Response (không đăng nhập):**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 1,
 *               "title": "Dọn dẹp công viên Tao Đàn",
 *               "description": "<p>Tham gia dọn dẹp, trồng cây xanh...</p>",
 *               "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
 *               "startDate": "2026-08-15T08:00:00.000Z",
 *               "endDate": "2026-08-15T17:00:00.000Z",
 *               "applicationDeadline": "2026-08-10T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 32,
 *               "remainingSlots": 18,
 *               "isFull": false,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/event-banner.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-01T10:00:00.000Z",
 *               "updatedAt": "2026-07-10T15:30:00.000Z",
 *               "category": {
 *                 "id": 3,
 *                 "name": "Môi trường",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 5,
 *                 "fullName": "Nguyễn Văn A",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *               },
 *               "userApplication": null
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Đã apply, trạng thái PENDING:**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 1,
 *               "title": "Dọn dẹp công viên Tao Đàn",
 *               "description": "<p>Tham gia dọn dẹp, trồng cây xanh...</p>",
 *               "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
 *               "startDate": "2026-08-15T08:00:00.000Z",
 *               "endDate": "2026-08-15T17:00:00.000Z",
 *               "applicationDeadline": "2026-08-10T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 32,
 *               "remainingSlots": 18,
 *               "isFull": false,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/event-banner.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-01T10:00:00.000Z",
 *               "updatedAt": "2026-07-10T15:30:00.000Z",
 *               "category": {
 *                 "id": 3,
 *                 "name": "Môi trường",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 5,
 *                 "fullName": "Nguyễn Văn A",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *               },
 *               "userApplication": {
 *                 "id": 42,
 *                 "status": "PENDING",
 *                 "createdAt": "2026-07-12T09:30:00.000Z"
 *               }
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Đã apply, trạng thái APPROVED:**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 1,
 *               "title": "Dọn dẹp công viên Tao Đàn",
 *               "description": "<p>Tham gia dọn dẹp, trồng cây xanh...</p>",
 *               "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
 *               "startDate": "2026-08-15T08:00:00.000Z",
 *               "endDate": "2026-08-15T17:00:00.000Z",
 *               "applicationDeadline": "2026-08-10T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 32,
 *               "remainingSlots": 18,
 *               "isFull": false,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/event-banner.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-01T10:00:00.000Z",
 *               "updatedAt": "2026-07-10T15:30:00.000Z",
 *               "category": {
 *                 "id": 3,
 *                 "name": "Môi trường",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 5,
 *                 "fullName": "Nguyễn Văn A",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *               },
 *               "userApplication": {
 *                 "id": 42,
 *                 "status": "APPROVED",
 *                 "createdAt": "2026-07-12T09:30:00.000Z"
 *               }
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Đã apply, trạng thái REJECTED:**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 1,
 *               "title": "Dọn dẹp công viên Tao Đàn",
 *               "description": "<p>Tham gia dọn dẹp, trồng cây xanh...</p>",
 *               "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
 *               "startDate": "2026-08-15T08:00:00.000Z",
 *               "endDate": "2026-08-15T17:00:00.000Z",
 *               "applicationDeadline": "2026-08-10T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 32,
 *               "remainingSlots": 18,
 *               "isFull": false,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/event-banner.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-01T10:00:00.000Z",
 *               "updatedAt": "2026-07-10T15:30:00.000Z",
 *               "category": {
 *                 "id": 3,
 *                 "name": "Môi trường",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 5,
 *                 "fullName": "Nguyễn Văn A",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *               },
 *               "userApplication": {
 *                 "id": 42,
 *                 "status": "REJECTED",
 *                 "createdAt": "2026-07-12T09:30:00.000Z"
 *               }
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Đã apply, trạng thái CANCELLED:**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 1,
 *               "title": "Dọn dẹp công viên Tao Đàn",
 *               "description": "<p>Tham gia dọn dẹp, trồng cây xanh...</p>",
 *               "location": "Công viên Tao Đàn, Quận 1, TP.HCM",
 *               "startDate": "2026-08-15T08:00:00.000Z",
 *               "endDate": "2026-08-15T17:00:00.000Z",
 *               "applicationDeadline": "2026-08-10T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 32,
 *               "remainingSlots": 18,
 *               "isFull": false,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/event-banner.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-01T10:00:00.000Z",
 *               "updatedAt": "2026-07-10T15:30:00.000Z",
 *               "category": {
 *                 "id": 3,
 *                 "name": "Môi trường",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 5,
 *                 "fullName": "Nguyễn Văn A",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *               },
 *               "userApplication": {
 *                 "id": 42,
 *                 "status": "CANCELLED",
 *                 "createdAt": "2026-07-12T09:30:00.000Z"
 *               }
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Event đầy (isFull: true):**
 *           ```json
 *           {
 *             "success": true,
 *             "data": {
 *               "id": 2,
 *               "title": "Hiến máu nhân đạo",
 *               "description": "<p>Sự kiện hiến máu tình nguyện...</p>",
 *               "location": "Bệnh viện Chợ Rẫy, TP.HCM",
 *               "startDate": "2026-08-20T08:00:00.000Z",
 *               "endDate": "2026-08-20T12:00:00.000Z",
 *               "applicationDeadline": "2026-08-18T23:59:59.000Z",
 *               "maxCapacity": 50,
 *               "approvedParticipants": 50,
 *               "remainingSlots": 0,
 *               "isFull": true,
 *               "imageUrl": "https://res.cloudinary.com/vms/image/upload/blood-donation.jpg",
 *               "status": "PUBLISHED",
 *               "createdAt": "2026-07-05T08:00:00.000Z",
 *               "updatedAt": "2026-07-18T10:00:00.000Z",
 *               "category": {
 *                 "id": 5,
 *                 "name": "Y tế",
 *                 "categoryType": "TYPE"
 *               },
 *               "createdBy": {
 *                 "id": 8,
 *                 "fullName": "Trần Thị B",
 *                 "avatarUrl": "https://res.cloudinary.com/vms/image/upload/avatar2.jpg"
 *               },
 *               "userApplication": {
 *                 "id": 88,
 *                 "status": "APPROVED",
 *                 "createdAt": "2026-07-15T08:00:00.000Z"
 *               }
 *             }
 *           }
 *           ```
 *
 *           **Volunteer Response — Token hết hạn / invalid → Fallback Guest:**
 *           Vẫn trả về 200 với `userApplication: null` (giống Guest response).
 *           Middleware `authenticateOptional` không throw 401.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Dọn dẹp công viên Tao Đàn"
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: "<p>Tham gia dọn dẹp, trồng cây xanh tại công viên Tao Đàn.</p>"
 *                     location:
 *                       type: string
 *                       example: "Công viên Tao Đàn, Quận 1, TP.HCM"
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-15T08:00:00.000Z"
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-15T17:00:00.000Z"
 *                     applicationDeadline:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-10T23:59:59.000Z"
 *                     maxCapacity:
 *                       type: integer
 *                       example: 50
 *                     approvedParticipants:
 *                       type: integer
 *                       example: 32
 *                     remainingSlots:
 *                       type: integer
 *                       example: 18
 *                     isFull:
 *                       type: boolean
 *                       example: false
 *                     imageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "https://res.cloudinary.com/vms/image/upload/event-banner.jpg"
 *                     status:
 *                       type: string
 *                       enum: [PUBLISHED, IN_PROGRESS, COMPLETED]
 *                       example: "PUBLISHED"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-01T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-10T15:30:00.000Z"
 *                     category:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3
 *                         name:
 *                           type: string
 *                           example: "Môi trường"
 *                         categoryType:
 *                           type: string
 *                           enum: [LOCATION, TIME, TYPE]
 *                           example: "TYPE"
 *                     createdBy:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         fullName:
 *                           type: string
 *                           example: "Nguyễn Văn A"
 *                         avatarUrl:
 *                           type: string
 *                           nullable: true
 *                           example: "https://res.cloudinary.com/vms/image/upload/avatar.jpg"
 *                     userApplication:
 *                       type: object
 *                       nullable: true
 *                       description: |
 *                         null nếu user là Guest hoặc Volunteer chưa apply.
 *                         Có giá trị nếu Volunteer đã apply.
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 42
 *                         status:
 *                           type: string
 *                           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *                           example: "PENDING"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-07-12T09:30:00.000Z"
 *       400:
 *         description: ID sự kiện không hợp lệ (không phải số nguyên dương)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "ID sự kiện không hợp lệ."
 *                 details:
 *                   - field: "id"
 *                     message: "ID sự kiện phải là số nguyên dương"
 *       404:
 *         description: |
 *           Không tìm thấy sự kiện — các tình huống:
 *           - ID không tồn tại trong DB
 *           - Event bị soft-delete (isActive = false)
 *           - Event ở trạng thái DRAFT / PENDING_APPROVAL / REJECTED / CANCELLED
 *
 *           Tất cả trả về cùng message để tránh information disclosure.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "NOT_FOUND"
 *                 message: "Không tìm thấy sự kiện."
 *       500:
 *         description: Lỗi server không mong đợi (database timeout, internal error)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INTERNAL_ERROR"
 *                 message: "Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau."
 */
router.get(
    "/:id",
    authenticateOptional,
    validateParams(getByIdParamSchema),
    eventController.getEventById
);

export default router;
