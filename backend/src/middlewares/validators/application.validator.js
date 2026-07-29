/**
 * Application Validation Schemas — Zod schemas for application endpoints.
 *
 * Owner: Member 1 - CuongLH
 * Features: UC10 — Submit Application, UC14 — Cancel Application
 */
import { z } from "zod";

/**
 * Schema for POST /api/v1/applications
 * Validates the request body for submitting a new application.
 */
export const submitApplicationSchema = z.object({
  eventId: z
    .number({ required_error: "eventId là bắt buộc", invalid_type_error: "eventId phải là số" })
    .int("eventId phải là số nguyên")
    .positive("eventId phải là số nguyên dương"),
});

/**
 * Schema for PATCH /api/v1/applications/:id/cancel
 * Validates the path param :id is a positive integer.
 */
export const cancelApplicationParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "ID đơn đăng ký không hợp lệ")
    .transform(Number),
});

export default { submitApplicationSchema, cancelApplicationParamsSchema };
