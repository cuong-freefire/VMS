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

export {
    getCategoriesHandler
};