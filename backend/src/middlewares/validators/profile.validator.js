/**
 * Profile Validator
 *
 * Zod schemas cho Edit Profile (UC19).
 * Dùng validate từ validate.js (shared middleware factory).
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { z } from "zod";
import { validate } from "./validate.js";

const vietnamPhoneRegex = /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7,8}$/;

/**
 * Schema cho PATCH /api/v1/user/me
 * .strict() tự động strip các field không định nghĩa (email, password, role_id...)
 */
export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(255, "Họ tên không được vượt quá 255 ký tự")
      .optional(),
    phone_number: z
      .string()
      .min(10, "Số điện thoại phải có ít nhất 10 chữ số")
      .max(11, "Số điện thoại không được vượt quá 11 chữ số")
      .refine((val) => vietnamPhoneRegex.test(val), {
        message: "Số điện thoại không đúng định dạng (VD: 0987654321)",
      })
      .optional(),
  })
  .strict();

/**
 * Middleware validate req.body bằng updateProfileSchema.
 * Dùng validate() từ file dùng chung.
 * Sau khi validate: req.body chứa dữ liệu đã clean/strip.
 */
export const validateUpdateProfile = validate(updateProfileSchema);
