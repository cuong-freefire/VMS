/**
 * User Controller - HTTP layer for User Management module
 * Owner: Member 4 - DucNM (UC26, UC27, UC28, UC29, UC30)
 *
 * Responsibilities:
 * - Handle HTTP request/response for user management endpoints
 * - Extract query params and pass to Service layer
 * - Return standardized API response
 *
 * Rules:
 * - No business logic in Controller
 * - Always use response.util.js for response format
 * - userId MUST come from JWT (req.user), NOT from request body
 */

import userService from '../services/user.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * GET /api/v1/users
 * Lấy danh sách người dùng với phân trang, tìm kiếm, lọc, sắp xếp.
 * Chỉ Admin mới có quyền truy cập (kiểm tra ở middleware).
 *
 * Query params:
 *   - page: Số trang (default: 1)
 *   - limit: Số items mỗi trang (default: 20, max: 100)
 *   - search: Tìm kiếm theo tên hoặc email
 *   - role: Lọc theo role (volunteer, staff, manager, admin)
 *   - sort: Sắp xếp (field:direction, default: created_at:desc)
 */
async function getUsersHandler(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await userService.getUsers(query);

        const message = result.users.length > 0
            ? 'Lấy danh sách người dùng thành công'
            : 'Không tìm thấy người dùng nào';

        return res.status(200).json(
            successResponse(result, message)
        );
    } catch (error) {
        // ServiceError sẽ được catch bởi global error handler
        if (error.status && error.code) {
            return res.status(error.status).json(
                errorResponse(error.message, error.code, error.details)
            );
        }
        next(error);
    }
}

/**
 * GET /api/v1/users/:id
 * Lấy thông tin chi tiết của một người dùng theo ID.
 * Chỉ Admin mới có quyền truy cập (kiểm tra ở middleware).
 * Vẫn trả về user bị soft-delete (is_active = false).
 *
 * Route params:
 *   - id: User ID (số nguyên dương)
 */
async function getUserByIdHandler(req, res, next) {
    try {
        const userId = req.validatedParams.id;
        const user = await userService.getUserById(userId);

        return res.status(200).json(
            successResponse(user, 'Lấy thông tin người dùng thành công')
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
 * POST /api/v1/users
 * Tạo người dùng mới.
 * Chỉ Admin mới có quyền truy cập (kiểm tra ở middleware).
 * Mật khẩu được hash bằng bcryptjs trước khi lưu.
 */
async function createUserHandler(req, res, next) {
    try {
        const user = await userService.createUserService(req.body);

        return res.status(201).json(
            successResponse(user, 'Tạo người dùng thành công')
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
 * PATCH /api/v1/users/:id
 * Cập nhật thông tin người dùng.
 * Chỉ Admin mới có quyền truy cập (kiểm tra ở middleware).
 * Email không thể thay đổi. Admin không thể tự hạ role của chính mình.
 */
async function updateUserHandler(req, res, next) {
    try {
        const userId = req.validatedParams.id;
        const currentUserId = req.user.user_id;
        const user = await userService.updateUserService(userId, req.body, currentUserId);

        return res.status(200).json(
            successResponse(user, 'Cập nhật thông tin người dùng thành công')
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
    getUsersHandler,
    getUserByIdHandler,
    createUserHandler,
    updateUserHandler
};
