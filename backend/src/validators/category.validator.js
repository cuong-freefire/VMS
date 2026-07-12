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