/**
 * User Validator - Zod Schemas
 *
 * Validation cho User Management API:
 * - UC26/UC30: getUsersSchema (query params: page, limit, search, role, sort, is_active, from_date, to_date)
 * - UC27: userIdSchema (route param)
 * - UC28: createUserSchema (request body)
 * - UC29: updateUserSchema (request body)
 *
 * Owner: Member 4 - DucNM (UC26, UC27, UC28, UC29, UC30)
 */

import { z } from 'zod';

/**
 * Schema validation cho userId route param.
 * Yêu cầu: số nguyên dương.
 * Dùng trong GET /api/v1/users/:id
 */
export const userIdSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive("User ID phải là số nguyên dương")
});

/**
 * Checks whether a date string is in the YYYY-MM-DD format
 * and represents a valid calendar date.
 */
const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
};

/**
 * Schema validation cho POST /api/v1/users request body.
 * UC28: Add User — Admin tạo tài khoản mới.
 */
export const createUserSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().trim().email('Invalid email format'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role_id: z.coerce.number().int().positive('Role is required')
});

/**
 * Schema validation cho PATCH /api/v1/users/:id request body.
 * UC29: Edit User — Admin chỉnh sửa thông tin user.
 * Tất cả fields đều optional (PATCH = partial update).
 * Email không được phép thay đổi (bất biến).
 */
export const updateUserSchema = z.object({
    full_name: z.string().trim().min(1, 'Full name cannot be empty').optional(),
    phone: z.string().optional(),
    avatar_url: z.string().trim().url('Invalid URL format').optional().nullable(),
    role_id: z.coerce.number().int().positive('Role is required').optional(),
    is_active: z.boolean().optional()
}).refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'No fields to update.'
});

/**
 * Schema validation cho GET /api/v1/users query params.
 * UC26: View User List — page, limit, search, role, sort.
 * UC30: Filter User — thêm is_active, from_date, to_date + date range validation.
 */
export const getUsersSchema = z.object({
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
    search: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                // Cho phép chữ, số, khoảng trắng, @, ., -
                return /^[\w\s@.\-À-ÿà-ỹ]+$/.test(val);
            },
            { message: 'Từ khóa tìm kiếm không hợp lệ' }
        ),
    role: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                const allowedRoles = ['volunteer', 'staff', 'manager', 'admin'];
                return allowedRoles.includes(val.toLowerCase());
            },
            { message: 'Role không hợp lệ. Chấp nhận: volunteer, staff, manager, admin' }
        ),
    sort: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                // Format: field:direction (VD: created_at:desc, full_name:asc)
                const match = val.match(/^(\w+):(asc|desc|ASC|DESC)$/);
                if (!match) return false;
                const allowedFields = ['created_at', 'full_name', 'email'];
                return allowedFields.includes(match[1]);
            },
            { message: 'Tham số sort không đúng định dạng (field:direction)' }
        ),
    // UC30 Filter User: lọc theo trạng thái active/inactive
    is_active: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                return ['true', 'false'].includes(val.toLowerCase());
            },
            { message: 'is_active phải là true hoặc false' }
        ),
    // UC30 Filter User: lọc theo ngày tạo (from_date)
    from_date: z
        .string()
        .optional()
        .refine(
            (val) => !val || isValidDate(val),
            { message: 'from_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD' }
        ),
    // UC30 Filter User: lọc theo ngày tạo (to_date)
    to_date: z
        .string()
        .optional()
        .refine(
            (val) => !val || isValidDate(val),
            { message: 'to_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD' }
        )
}).refine(
    (data) => {
        // Chỉ validate date range nếu cả from_date và to_date đều có giá trị
        if (!data.from_date || !data.to_date) {return true;}
        return new Date(data.from_date) <= new Date(data.to_date);
    },
    { message: 'from_date phải trước hoặc bằng to_date', path: ['from_date'] }
);