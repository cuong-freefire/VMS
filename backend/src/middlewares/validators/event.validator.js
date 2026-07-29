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

/**
 * Schema for GET /api/v1/events
 * Validates query params for pagination, filtering, and sorting.
 */
export const listEventsQuerySchema = z.object({
  page: z
    .coerce
    .number()
    .int("Page phải là số nguyên")
    .min(1, "Page phải >= 1")
    .default(1),
  limit: z
    .coerce
    .number()
    .int("Limit phải là số nguyên")
    .min(1, "Limit phải >= 1")
    .max(50, "Limit tối đa 50")
    .default(12),
  search: z
    .string()
    .optional(),
  category: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number()
      .int("Category phải là số nguyên")
      .positive("Category phải là số nguyên dương")
      .optional(),
  ),
  sort: z
    .enum(["newest", "oldest", "upcoming"], {
      errorMap: () => ({ message: "Sort phải là newest, oldest, hoặc upcoming" }),
    })
    .default("newest"),
  isPaid: z.preprocess(
    (val) => {
      if (val === "true" || val === "1") return true;
      if (val === "false" || val === "0") return false;
      if (val === "" || val === undefined || val === null) return undefined;
      return val;
    },
    z.boolean({ invalid_type_error: "isPaid phải là true hoặc false" }).optional(),
  ),
  hasSlots: z.preprocess(
    (val) => {
      if (val === "true" || val === "1") return true;
      if (val === "false" || val === "0") return false;
      if (val === "" || val === undefined || val === null) return undefined;
      return val;
    },
    z.boolean({ invalid_type_error: "hasSlots phải là true hoặc false" }).optional(),
  ),
});

export default { getByIdParamSchema, listEventsQuerySchema };