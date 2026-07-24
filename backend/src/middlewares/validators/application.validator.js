/**
 * Application Validator - Zod Schemas
 *
 * Validation cho Application Management API.
 * - getApplicationsQuerySchema: GET /api/v1/events/:eventId/applications (UC22)
 * - applicationIdParamSchema: GET /api/v1/applications/:applicationId (UC23)
 *
 * Owner: Member 4 - DucNM (UC22, UC23)
 */

import { z } from 'zod';

const ALLOWED_APPLICATION_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'cancelled'
];

/**
 * Schema validation cho GET /api/v1/events/:eventId/applications query params.
 * UC22: View Application List — Staff xem danh sách đơn đăng ký của sự kiện.
 *
 * Query params:
 * - status: optional, filter by application status
 * - page: optional, page number (default 1)
 * - limit: optional, records per page (default 20, max 100)
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