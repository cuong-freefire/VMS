/**
 * Event Validator - Zod Schemas
 *
 * Validation cho Event Management API.
 * - getEventsQuerySchema: GET /api/v1/events (View Pending Event - UC67)
 * - rejectEventSchema: PATCH /api/v1/events/:id/reject (Reject Event - UC70)
 * - createEventSchema POST /api/v1/events (Add event - UC15)
 * - updateEventSchema PATCH /api/v1/events/:id (Edit event - UC16)
 * Owner: Member 5 - DucNM (UC15, UC16, UC67, UC69, UC70)
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
        .min(10, 'Lý do từ chối phải có ít nhất 10 ký tự.')
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
        .min(10, 'Tiêu đề phải có ít nhất 10 ký tự.')
        .max(500, 'Tiêu đề không được vượt quá 500 ký tự.'),

    description: z
        .string()
        .trim()
        .min(50, 'Mô tả phải có ít nhất 50 ký tự.')
        .max(5000, 'Mô tả không được vượt quá 5000 ký tự.'),

    startDate: z
        .string()
        .datetime({ message: 'Ngày bắt đầu không đúng định dạng ISO 8601.' }),

    endDate: z
        .string()
        .datetime({ message: 'Ngày kết thúc không đúng định dạng ISO 8601.' }),

    applicationDeadline: z
        .string()
        .datetime({ message: 'Hạn đăng ký không đúng định dạng ISO 8601.' }),

    location: z
        .string()
        .trim()
        .min(5, 'Địa điểm phải có ít nhất 5 ký tự.')
        .max(500, 'Địa điểm không được vượt quá 500 ký tự.'),

    maxCapacity: z
        .coerce()
        .number()
        .int('Sức chứa phải là số nguyên.')
        .min(1, 'Sức chứa phải lớn hơn hoặc bằng 1.')
        .max(10000, 'Sức chứa không được vượt quá 10000.'),

    categoryId: z
        .coerce()
        .number()
        .int('Danh mục phải là số nguyên.')
        .positive('Danh mục không hợp lệ.'),

    imageUrl: z
        .string()
        .url('Đường dẫn ảnh không hợp lệ.')
        .optional()
        .nullable()
}).refine((data) => new Date(data.startDate) > new Date(), {
    message: 'Ngày bắt đầu phải ở trong tương lai',
    path: ['startDate']
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'Ngày kết thúc phải sau ngày bắt đầu.',
    path: ['endDate']
}).refine((data) => new Date(data.applicationDeadline) < new Date(data.startDate), {
    message: 'Hạn đăng ký phải trước ngày bắt đầu.',
    path: ['applicationDeadline']
});

/**
 * Schema validation cho PATCH /api/v1/events/:id request body.
 * UC16: Edit Event — Staff cập nhật thông tin sự kiện.
 *
 * Validation rules:
 * - All fields are optional (PATCH semantics)
 * - title: 10-500 characters
 * - description: 50-5000 characters
 * - location: 5-500 characters
 * - maxCapacity: 1-10000, integer
 * - categoryId: positive integer
 * - imageUrl: optional, HTTPS URL
 * - startDate: ISO 8601 datetime
 * - endDate: ISO 8601 datetime
 * - applicationDeadline: ISO 8601 datetime
 * - Cross-field: endDate > startDate, applicationDeadline < startDate
 * - .strict() rejects unknown fields
 */
export const updateEventSchema = z.object({
    title: z
        .string()
        .trim()
        .min(10, 'Tiêu đề phải có ít nhất 10 ký tự.')
        .max(500, 'Tiêu đề không được vượt quá 500 ký tự.')
        .optional(),

    description: z
        .string()
        .trim()
        .min(50, 'Mô tả phải có ít nhất 50 ký tự.')
        .max(5000, 'Mô tả không được vượt quá 5000 ký tự.')
        .optional(),

    startDate: z
        .string()
        .datetime({ message: 'Ngày bắt đầu không đúng định dạng ISO 8601.' })
        .optional(),

    endDate: z
        .string()
        .datetime({ message: 'Ngày kết thúc không đúng định dạng ISO 8601.' })
        .optional(),

    applicationDeadline: z
        .string()
        .datetime({ message: 'Hạn đăng ký không đúng định dạng ISO 8601.' })
        .optional(),

    location: z
        .string()
        .trim()
        .min(5, 'Địa điểm phải có ít nhất 5 ký tự.')
        .max(500, 'Địa điểm không được vượt quá 500 ký tự.')
        .optional(),

    maxCapacity: z
        .coerce()
        .number()
        .int('Sức chứa phải là số nguyên.')
        .min(1, 'Sức chứa phải lớn hơn hoặc bằng 1.')
        .max(10000, 'Sức chứa không được vượt quá 10000.')
        .optional(),

    categoryId: z
        .coerce()
        .number()
        .int('Danh mục phải là số nguyên.')
        .positive('Danh mục không hợp lệ.')
        .optional(),

    imageUrl: z
        .string()
        .url('Đường dẫn ảnh không hợp lệ.')
        .optional()
        .nullable()
}).strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: 'Phải cung cấp ít nhất một trường để cập nhật.'
        }
    )
    .refine((data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
    }, {
        message: 'Ngày kết thúc phải sau ngày bắt đầu.',
        path: ['endDate']
    })
    .refine((data) => {
        if (data.startDate && data.applicationDeadline) {
            return new Date(data.applicationDeadline) < new Date(data.startDate);
        }
        return true;
    }, {
        message: 'Hạn đăng ký phải trước ngày bắt đầu.',
        path: ['applicationDeadline']
    });