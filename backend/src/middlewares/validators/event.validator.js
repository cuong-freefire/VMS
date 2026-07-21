/**
 * Event Validation Schemas — Zod schemas for event endpoints
 * Owner: Member 1 (CuongLH)
 *
 * Schemas:
 * - getByIdParamSchema: Validate path parameter `id` for GET /api/v1/events/:id
 */

import { z } from "zod";

/**
 * Schema for GET /api/v1/events/:id
 * Validates path parameter `id` is a positive integer.
 */
export const getByIdParamSchema = z.object({
  id: z
    .coerce
    .number({
      required_error: "ID sự kiện là bắt buộc",
      invalid_type_error: "ID sự kiện phải là số nguyên dương",
    })
    .int("ID sự kiện phải là số nguyên")
    .positive("ID sự kiện phải là số nguyên dương"),
});

export default { getByIdParamSchema };
