/**
 * User Validator - Zod Schemas
 *
 * Validation cho các query params của User Management API.
 * Bao gồm: phân trang, tìm kiếm, lọc theo role, sắp xếp.
 * Mở rộng cho UC27: userId schema cho route param.
 *
 * Owner: Member 4 - DucNM (UC26, UC27)
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
 * Schema validation cho GET /api/v1/users query params.
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
        )
});