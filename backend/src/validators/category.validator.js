/**
 * Category Validator - Zod Schemas
 *
 * Validation cho Category Management API.
 * - createCategorySchema: POST /api/v1/categories
 *
 * Owner: Member 4 - DucNM (UC32)
 */

import { z } from 'zod';

/**
 * Schema validation cho POST /api/v1/categories request body.
 * UC32: Add Category — Manager/Admin thêm danh mục mới.
 */
export const createCategorySchema = z.object({
    name: z.string().trim().min(1, 'Category name is required'),
    description: z.string().optional(),
    type: z.enum(['location', 'event_type', 'time_frame'], {
        errorMap: () => ({ message: 'Type must be: location, event_type, or time_frame' })
    })
});

/**
 * Schema validation cho PATCH /api/v1/categories/:id request body.
 * UC33: Edit Category — Manager/Admin chỉnh sửa danh mục.
 * Tất cả fields đều optional (PATCH = partial update).
 * Type KHÔNG được phép thay đổi (bất biến).
 */
export const updateCategorySchema = z.object({
    name: z.string().trim().min(1, 'Category name cannot be empty').optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional()
}).strict().refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update.'
});
