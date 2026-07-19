/**
 * Event Validator - Zod Schemas
 *
 * Validation cho Event Management API.
 * - getEventsQuerySchema: GET /api/v1/events (View Pending Event - UC67)
 * - rejectEventSchema: PATCH /api/v1/events/:id/reject (Reject Event - UC70)
 *
 * Owner: Member 5 - DucNM (UC67, UC70)
 */

import { z } from 'zod';

const ALLOWED_EVENT_STATUSES = [
    'draft',
    'pending_approval',
    'published',
    'rejected',
    'in_progress',
    'completed',
    'cancelled'
];

/**
 * Schema validation cho GET /api/v1/events query params.
 * UC67: View Event List với phân trang và lọc theo status.
 * Manager/Admin có thể sử dụng status=pending_approval để xem danh sách sự kiện chờ duyệt.
 * Hỗ trợ phân trang (page, limit) và lọc theo status.
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
                return ALLOWED_EVENT_STATUSES.includes(val.toLowerCase());
            },
            { message: `Status không hợp lệ. Chấp nhận: ${ALLOWED_EVENT_STATUSES.join(', ')}` }
        )
});

/**
 * Schema validation cho PATCH /api/v1/events/:id/reject request body.
 * UC70: Reject Event — Manager/Admin từ chối sự kiện kèm lý do.
 * rejection_reason: bắt buộc, tối thiểu 10 ký tự.
 */
export const rejectEventSchema = z.object({
    rejection_reason: z
        .string()
        .trim()
        .min(10, 'Rejection reason must be at least 10 characters.')
});