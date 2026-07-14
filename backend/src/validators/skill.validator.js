/**
 * Skill Validator - Zod Schemas
 *
 * Validation cho Skill Management API.
 *
 * Owner: Member 4 - DucNM (UC34, UC35)
 */

import { z } from 'zod';

// Validator (dự phòng cho các UC sau)
export const skillIdSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive("Skill ID phải là số nguyên dương")
});

/**
 * Schema validation cho POST /api/v1/skills request body.
 * UC35: Add Skill — Manager/Admin thêm kỹ năng mới.
 */
export const createSkillSchema = z.object({
    name: z.string().trim().min(1, 'Skill name is required'),
    description: z.string().optional()
}).strict();

/**
 * Schema validation cho PATCH /api/v1/skills/:id request body.
 * UC36: Edit Skill — Manager/Admin chỉnh sửa kỹ năng.
 * Tất cả fields đều optional (PATCH = partial update).
 */
export const updateSkillSchema = z.object({
    name: z.string().trim().min(1, 'Skill name cannot be empty').optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional()
}).strict().refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update.'
});
