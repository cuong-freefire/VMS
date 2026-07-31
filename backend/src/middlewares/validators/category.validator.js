/**
 * Category Validator - Zod Schemas
 *
 * Validation cho Category Management API:
 * - UC31/UC-feat-search-category: getCategoriesQuerySchema (query params)
 * - UC32: createCategorySchema (request body)
 * - UC33: updateCategorySchema (request body), categoryIdSchema (route param)
 *
 * Owner: Member 4 - DucNM (UC31, UC32, UC33, UC-feat-search-category)
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

/**
 * Schema validation cho categoryId route param.
 * UC33: Edit Category — validate id là số nguyên dương.
 */
export const categoryIdSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive("Category ID phải là số nguyên dương")
});

/**
 * Schema validation cho GET /api/v1/categories query params.
 * UC31: View Category List — page, limit, search, type, sort.
 * UC-feat-search-category: thêm search param để tìm kiếm danh mục.
 */
export const getCategoriesQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = parseInt(val, 10);
                return !isNaN(num) && num >= 1;
            },
            { message: 'Tham số page không hợp lệ' }
        ),
    limit: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = parseInt(val, 10);
                return !isNaN(num) && num >= 1 && num <= 100;
            },
            { message: 'Tham số limit phải từ 1 đến 100' }
        ),
    search: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                // Cho phép chữ, số, khoảng trắng, -
                return /^[\w\s\-À-ÿà-ỹ]+$/.test(val);
            },
            { message: 'Từ khóa tìm kiếm không hợp lệ' }
        ),
    type: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const allowedTypes = ['location', 'event_type', 'time_frame'];
                return allowedTypes.includes(val.trim().toLowerCase());
            },
            { message: 'Type không hợp lệ. Chấp nhận: location, event_type, time_frame' }
        ),
    sort: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                // Format: field:direction (VD: created_at:desc, name:asc)
                const match = val.match(/^(\w+):(asc|desc|ASC|DESC)$/);
                if (!match) return false;
                const allowedFields = ['created_at', 'updated_at', 'name'];
                return allowedFields.includes(match[1]);
            },
            { message: 'Tham số sort không đúng định dạng (field:direction)' }
        )
});