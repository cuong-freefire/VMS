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

/**
 * Schema validation cho POST /api/v1/events request body.
 * UC15: Add Event — Staff tạo sự kiện mới.
 *
 * Validation rules:
 * - title: 10-500 characters, required
 * - description: 50-5000 characters, required
 * - startDate: ISO 8601 datetime, must be in the future
 * - endDate: ISO 8601 datetime, must be after startDate
 * - applicationDeadline: ISO 8601 datetime, must be before startDate
 * - location: 5-500 characters, required
 * - maxCapacity: 1-10000, integer, required
 * - categoryId: positive integer, required
 * - imageUrl: optional, HTTPS URL
 */
export const createEventSchema = z.object({
    title: z
        .string()
        .trim()
        .min(10, 'Title must be at least 10 characters')
        .max(500, 'Title must not exceed 500 characters'),

    description: z
        .string()
        .trim()
        .min(50, 'Description must be at least 50 characters')
        .max(5000, 'Description must not exceed 5000 characters'),

    startDate: z
        .string()
        .datetime({ message: 'Start date must be a valid ISO 8601 datetime' }),

    endDate: z
        .string()
        .datetime({ message: 'End date must be a valid ISO 8601 datetime' }),

    applicationDeadline: z
        .string()
        .datetime({ message: 'Application deadline must be a valid ISO 8601 datetime' }),

    location: z
        .string()
        .trim()
        .min(5, 'Location must be at least 5 characters')
        .max(500, 'Location must not exceed 500 characters'),

    maxCapacity: z
        .coerce()
        .number()
        .int('Capacity must be an integer')
        .min(1, 'Capacity must be at least 1')
        .max(10000, 'Capacity must not exceed 10000'),

    categoryId: z
        .coerce()
        .number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive'),

    imageUrl: z
        .string()
        .url('Invalid image URL')
        .optional()
        .nullable()
}).refine((data) => new Date(data.startDate) > new Date(), {
    message: 'Start date must be in the future',
    path: ['startDate']
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate']
}).refine((data) => new Date(data.applicationDeadline) < new Date(data.startDate), {
    message: 'Application deadline must be before start date',
    path: ['applicationDeadline']
});
