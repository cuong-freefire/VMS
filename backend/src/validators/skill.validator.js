/**
 * Skill Validator - Zod Schemas
 *
 * Validation cho Skill Management API.
 * - (Optional: GET /api/v1/skills không cần params)
 *
 * Owner: Member 4 - DucNM (UC34)
 */

import { z } from 'zod';

// Validator (dự phòng cho các UC sau)
export const skillIdSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive("Skill ID phải là số nguyên dương")
});