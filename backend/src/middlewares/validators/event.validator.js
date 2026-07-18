/**
 * Event Validator - Zod Schemas
 *
 * Validation cho Event Management API.
 * - getEventsQuerySchema: GET /api/v1/events (View Pending Event - UC67)
 *
 * Owner: Member 5 - DucNM (UC67)
 */

import { z } from 'zod';

/**
 * Supported status values for UC67.
 */
const ALLOWED_STATUSES = [
    'pending_approval',
];
/**
 * Schema validation cho GET /api/v1/events query params.
 * UC67: View Pending Event — Manager/Admin xem danh sách sự kiện PENDING.
 * Hỗ trợ phân trang.
 * Status được sử dụng để lấy Pending Events theo API contract.
 */
export const getEventsQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = Number.parseInt(val, 10);
                return !Number.isNaN(num) && num >= 1;
            },
            { message: 'Tham số page không hợp lệ' }
        ),
    limit: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const num = Number.parseInt(val, 10);
                return !Number.isNaN(num) && num >= 1 && num <= 100;
            },
            { message: 'Tham số limit phải từ 1 đến 100' }
        ),
    status: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                return ALLOWED_STATUSES.includes(val.toLowerCase());
            },
            { message: `Status không hợp lệ. Chấp nhận: ${ALLOWED_STATUSES.join(', ')}` }
        )
}).strict();    