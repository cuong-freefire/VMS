/**
 * Organization Validator
 *
 * Zod schemas cho Organization endpoints.
 * Validation được thực hiện TRƯỚC khi request đến Controller.
 *
 * @module validators/organization.validator
 */

import { z } from 'zod';

/**
 * Schema cho query params của GET /api/v1/organizations
 */
export const listOrganizationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive('Page phải là số nguyên dương')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50, 'Limit tối đa là 50')),
  search: z
    .string()
    .optional()
    .default(''),
});

/**
 * Schema cho POST /api/v1/organizations (tạo mới)
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên tổ chức là bắt buộc')
    .max(255, 'Tên tổ chức tối đa 255 ký tự'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .nullable()
    .default(null),
  phone: z
    .string()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .optional()
    .nullable()
    .default(null),
  address: z
    .string()
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .optional()
    .nullable()
    .default(null),
  website: z
    .string()
    .url('Website không hợp lệ')
    .optional()
    .nullable()
    .default(null),
  logo_url: z
    .string()
    .url('Logo URL không hợp lệ')
    .optional()
    .nullable()
    .default(null),
  description: z
    .string()
    .max(2000, 'Mô tả tối đa 2000 ký tự')
    .optional()
    .nullable()
    .default(null),
});

/**
 * Schema cho PUT /api/v1/organizations/:id (cập nhật)
 * Tất cả fields đều optional — chỉ cập nhật những gì được gửi lên.
 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên tổ chức không được để trống')
    .max(255, 'Tên tổ chức tối đa 255 ký tự')
    .optional(),
  email: z
    .string()
    .email('Email không hợp lệ')
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .nullable()
    .optional(),
  website: z
    .string()
    .url('Website không hợp lệ')
    .nullable()
    .optional(),
  logo_url: z
    .string()
    .url('Logo URL không hợp lệ')
    .nullable()
    .optional(),
  description: z
    .string()
    .max(2000, 'Mô tả tối đa 2000 ký tự')
    .nullable()
    .optional(),
  is_active: z
    .boolean()
    .optional(),
});