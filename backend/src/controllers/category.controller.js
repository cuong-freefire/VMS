/**
 * Category Controller - HTTP layer for Category Management module
 * Owner: Member 4 - DucNM (UC31)
 *
 * Responsibilities:
 * - Handle HTTP request/response for category management endpoints
 * - Extract user info and pass to Service layer
 * - Return standardized API response
 *
 * Rules:
 * - Role-based visibility handled by Service layer
 * - Always use response.util.js for response format
 */

import categoryService from '../services/category.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * GET /api/v1/categories
 * Lấy danh sách danh mục với role-based visibility.
 * - Guest (không token) → chỉ active
 * - Volunteer/Staff → chỉ active
 * - Manager/Admin → tất cả (active + inactive)
 */
async function getCategoriesHandler(req, res, next) {
    try {
        const result = await categoryService.getCategories(req.user);

        const message = result.categories.length > 0
            ? 'Lấy danh sách danh mục thành công'
            : 'Không có danh mục nào';

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
 * POST /api/v1/categories
 * Tạo danh mục mới.
 * Chỉ Manager/Admin mới có quyền truy cập (kiểm tra ở middleware).
 */
async function createCategoryHandler(req, res, next) {
    try {
        const category = await categoryService.createCategoryService(req.body);

        return res.status(201).json(
            successResponse(category, 'Tạo danh mục thành công')
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
 * PATCH /api/v1/categories/:id
 * Cập nhật thông tin danh mục.
 * Chỉ Manager/Admin mới có quyền truy cập (kiểm tra ở middleware).
 * Type không thể thay đổi.
 */
async function updateCategoryHandler(req, res, next) {
    try {
        const categoryId = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(categoryId)) {
            return res.status(400).json(
                errorResponse(
                    'Invalid category ID.',
                    'INVALID_CATEGORY_ID'
                )
            );
        }

        const category = await categoryService.updateCategoryService(categoryId, req.body);

        return res.status(200).json(
            successResponse(category, 'Cập nhật danh mục thành công')
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
    getCategoriesHandler,
    createCategoryHandler,
    updateCategoryHandler
};
