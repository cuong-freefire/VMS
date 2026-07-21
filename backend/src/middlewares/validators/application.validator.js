/**
 * Application Validation Schemas — Zod schemas for application endpoints.
 *
 * Owner: Member 1 - CuongLH
 * Feature: UC14 — Cancel Application
 */
import { z } from "zod";

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

export default { cancelApplicationParamsSchema };