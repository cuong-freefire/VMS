/**
 * Event Validation Schemas — Zod schemas for event endpoints
 * Owner: Member 1 (CuongLH) — UC08, UC09 (Volunteer-facing event endpoints)
 * Owner: Member 5 (DucNM) — UC15, UC16, UC67, UC69, UC70
 *
 * Schemas:
 * - getByIdParamSchema: Validate path parameter `id` for GET /api/v1/events/:id
 * - listEventsQuerySchema: Validate query params for public event listing (UC08)
 * - getEventsQuerySchema: Validate query params for role-based event listing (UC67)
 * - createEventSchema: Validate request body for creating event (UC15)
 * - updateEventSchema: Validate request body for updating event (UC16)
 * - approveEventParamsSchema: Validate path param for approving event (UC69)
 * - rejectEventSchema: Validate request body for rejecting event (UC70)
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
 * Validates query params for public event listing (UC08).
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

/**
 * Schema for GET /api/v1/events (Management)
 * Validates query params for role-based event listing (UC67).
 * Cho phép Manager/Admin lọc theo status (bao gồm pending_approval).
 */
export const getEventsQuerySchema = z.object({
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
  status: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const allowedStatuses = ['draft', 'pending_approval', 'published', 'rejected', 'in_progress', 'completed', 'cancelled'];
        return allowedStatuses.includes(val.toLowerCase());
      },
      { message: 'Status không hợp lệ. Chấp nhận: draft, pending_approval, published, rejected, in_progress, completed, cancelled' }
    ),
  search: z
    .string()
    .optional(),
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return ['created_at:asc', 'created_at:desc', 'start_date:asc', 'start_date:desc'].includes(val.toLowerCase());
      },
      { message: 'Tham số sort không hợp lệ' }
    ),
});

/**
 * Schema for POST /api/v1/events
 * UC15: Create event validation.
 */
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title max 255 characters'),
  description: z.string().optional().nullable(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  maxCapacity: z.coerce.number().int().positive('Max capacity must be a positive integer'),
  categoryId: z.coerce.number().int().positive('Category is required'),
  imageUrl: z.string().optional().nullable()
});

/**
 * Schema for PATCH /api/v1/events/:id
 * UC16: Update event validation.
 * All fields are optional (PATCH = partial update).
 */
export const updateEventSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255, 'Title max 255 characters').optional(),
  description: z.string().optional().nullable(),
  location: z.string().min(1, 'Location cannot be empty').optional(),
  startDate: z.string().min(1, 'Start date is required').optional(),
  endDate: z.string().min(1, 'End date is required').optional(),
  applicationDeadline: z.string().min(1, 'Application deadline is required').optional(),
  maxCapacity: z.coerce.number().int().positive('Max capacity must be a positive integer').optional(),
  categoryId: z.coerce.number().int().positive('Category is required').optional(),
  imageUrl: z.string().optional().nullable()
}).refine(data => Object.keys(data).length > 0, {
  message: 'No fields to update.'
});

/**
 * Schema for PATCH /api/v1/events/:id/approve
 * UC69: Approve event params.
 */
export const approveEventParamsSchema = z.object({
  id: z.coerce.number().int().positive("Event ID phải là số nguyên dương")
});

/**
 * Schema for PATCH /api/v1/events/:id/reject
 * UC70: Reject event validation.
 */
export const rejectEventSchema = z.object({
  rejection_reason: z.string().min(1, 'Vui lòng cung cấp lý do từ chối').max(1000, 'Lý do từ chối tối đa 1000 ký tự')
});

export default {
  getByIdParamSchema,
  listEventsQuerySchema,
  getEventsQuerySchema,
  createEventSchema,
  updateEventSchema,
  approveEventParamsSchema,
  rejectEventSchema
};