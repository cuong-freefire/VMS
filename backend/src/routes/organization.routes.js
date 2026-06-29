/**
 * Organization Routes
 *
 * Định nghĩa tất cả endpoints RESTful cho Organization module (UC37-UC40).
 * Prefix: /api/v1/organizations (sẽ được mount tại app.js)
 *
 * @module routes/organization.routes
 */

import { Router } from 'express';
import organizationController from '../controllers/organization.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Organization ID
 *         name:
 *           type: string
 *           description: Tên tổ chức
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Email liên hệ
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Số điện thoại
 *         address:
 *           type: string
 *           nullable: true
 *           description: Địa chỉ
 *         website:
 *           type: string
 *           nullable: true
 *           description: Website
 *         logo_url:
 *           type: string
 *           nullable: true
 *           description: URL logo
 *         description:
 *           type: string
 *           nullable: true
 *           description: Mô tả
 *         is_active:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         event_count:
 *           type: integer
 *           description: Số lượng sự kiện
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total_items:
 *           type: integer
 *         total_pages:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Lấy danh sách tổ chức
 *     description: |
 *       Admin thấy tất cả tổ chức (active + inactive).
 *       Manager/Staff chỉ thấy tổ chức active.
 *       Volunteer/Guest bị từ chối.
 *     tags:
 *       - Organizations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số item mỗi trang (tối đa 50)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên (không phân biệt hoa/thường)
 *     responses:
 *       200:
 *         description: Danh sách tổ chức
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Organization'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Volunteer)
 */
router.get('/',
  authMiddleware,
  organizationController.list
);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Lấy chi tiết tổ chức
 *     description: |
 *       Admin thấy cả tổ chức inactive.
 *       Manager/Staff chỉ thấy active (inactive → 404).
 *       Trả về kèm danh sách 10 sự kiện gần nhất.
 *     tags:
 *       - Organizations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Chi tiết tổ chức
 *       404:
 *         description: Không tìm thấy tổ chức
 */
router.get('/:id',
  authMiddleware,
  organizationController.getById
);

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     summary: Tạo tổ chức mới (Admin only)
 *     tags:
 *       - Organizations
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên tổ chức (bắt buộc, unique)
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 nullable: true
 *               address:
 *                 type: string
 *                 nullable: true
 *               website:
 *                 type: string
 *                 nullable: true
 *               logo_url:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Tạo tổ chức thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       409:
 *         description: Tên tổ chức đã tồn tại
 */
router.post('/',
  authMiddleware,
  authorize('ADMIN'),
  organizationController.create
);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     summary: Cập nhật tổ chức (Admin only)
 *     description: |
 *       Admin cập nhật thông tin tổ chức hoặc vô hiệu hóa (soft-delete).
 *       Khi set is_active=false, kiểm tra không còn sự kiện đang hoạt động.
 *     tags:
 *       - Organizations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 nullable: true
 *               address:
 *                 type: string
 *                 nullable: true
 *               website:
 *                 type: string
 *                 nullable: true
 *               logo_url:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy tổ chức
 *       409:
 *         description: Tên đã tồn tại hoặc còn sự kiện đang hoạt động
 */
router.put('/:id',
  authMiddleware,
  authorize('ADMIN'),
  organizationController.update
);

export default router;