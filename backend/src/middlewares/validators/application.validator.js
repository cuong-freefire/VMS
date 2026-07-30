/**
 * Application Validation Schemas — Zod schemas for application endpoints.
 *
 * Owner: Member 1 - CuongLH (UC10, UC14)
 * Owner: Member 4 - DucNM (UC22, UC23, UC24, UC25)
 *
 * Features: UC10 — Submit Application, UC14 — Cancel Application
 *           UC22 — View Application List, UC23 — View Application Detail
 *           UC24 — Approve Application, UC25 — Reject Application
 */
import { z } from "zod";

const ALLOWED_APPLICATION_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'cancelled'
];

// ─── UC10-UC14: Volunteer-facing schemas ─────────────────────────────

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

// ─── UC22-UC25: Staff-facing schemas ─────────────────────────────────

/**
 * Schema validation cho GET /api/v1/events/:eventId/applications query params.
 * UC22: View Application List — Staff xem danh sách đơn đăng ký của sự kiện.
 */
export const getApplicationsQuerySchema = z.object({
    status: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                return ALLOWED_APPLICATION_STATUSES.includes(val.toLowerCase());
            },
            { message: `Trạng thái không hợp lệ. Phải là: ${ALLOWED_APPLICATION_STATUSES.join(', ')}` }
        ),
    page: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = Number(val);
                return Number.isInteger(num) && num >= 1 && num <= 1000;
            },
            { message: 'Tham số page không hợp lệ' }
        ),
    limit: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = Number(val);
                return Number.isInteger(num) && num >= 1 && num <= 100;
            },
            { message: 'Tham số limit phải từ 1 đến 100' }
        )
});

/**
 * Schema validation cho path param eventId.
 * UC22: View Application List — validate eventId là số nguyên dương.
 */
export const eventIdParamSchema = z.object({
    eventId: z
        .string()
        .trim()
        .refine(
            (val) => {
                const num = Number(val);
                return Number.isInteger(num) && num > 0;
            },
            { message: 'Mã sự kiện phải là số nguyên dương' }
        )
});

/**
 * Schema validation cho path param applicationId.
 * UC23: View Application Detail — validate applicationId là số nguyên dương.
 */
export const applicationIdParamSchema = z.object({
    applicationId: z
        .string()
        .trim()
        .refine(
            (val) => {
                const num = Number(val);
                return Number.isInteger(num) && num > 0;
            },
            { message: 'Mã đơn đăng ký phải là số nguyên dương' }
        )
});

/**
 * Schema validation cho PATCH /api/v1/applications/:applicationId/reject request body.
 * UC25: Reject Application — Staff từ chối đơn đăng ký kèm lý do.
 */
export const rejectApplicationSchema = z.object({
    message: z
        .string()
        .trim()
        .min(10, 'Lý do từ chối phải có ít nhất 10 ký tự')
        .max(2000, 'Lý do từ chối không được vượt quá 2000 ký tự')
});

export default {
    submitApplicationSchema,
    cancelApplicationParamsSchema,
    getApplicationsQuerySchema,
    eventIdParamSchema,
    applicationIdParamSchema,
    rejectApplicationSchema
};