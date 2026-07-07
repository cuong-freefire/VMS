/**
 * Authentication Validation Schemas - Zod schemas for auth endpoints
 * Owner: Member 1 (CuongLH)
 * 
 * Schemas:
 * - sendOTPSchema: Validates email for OTP request
 * - verifyOTPSchema: Validates all fields for OTP verification
 * 
 * Password Requirements:
 * - Min 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 */

import { z } from 'zod';

/**
 * Schema for POST /api/v1/auth/login (UC03 - Happy Path)
 * Validates email and password for login
 */
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string('Email là bắt buộc')
            .email('Email không hợp lệ')
            .max(255, 'Email quá dài (tối đa 255 ký tự)')
            .toLowerCase()
            .trim(),
        password: z
            .string('Mật khẩu là bắt buộc')
            .min(1, 'Mật khẩu không được để trống'),
    }),
});

/**
 * Schema for POST /api/v1/auth/register/send-otp
 * Validates email format and existence
 */
export const sendOTPSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Email không hợp lệ')
            .toLowerCase()
            .trim(),
    }),
});

/**
 * Schema for POST /api/v1/auth/register/verify-otp
 * Validates OTP, personal info, and password
 */
export const verifyOTPSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Email không hợp lệ')
            .toLowerCase()
            .trim(),
        otp: z
            .string()
            .length(6, 'Mã OTP phải có 6 chữ số')
            .regex(/^\d{6}$/, 'Mã OTP chỉ chứa chữ số'),
        fullName: z
            .string()
            .min(2, 'Họ tên phải có ít nhất 2 ký tự')
            .max(255, 'Họ tên không được vượt quá 255 ký tự')
            .trim(),
        phoneNumber: z
            .string()
            .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
            .trim(),
        password: z
            .string()
            .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
            .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
            .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in thường')
            .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số'),
    }),
});

/**
 * Middleware factory to validate request against schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */

/**
 * Schema for POST /api/v1/auth/forgot-password/request (UC07 Step 1)
 */
export const requestResetSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
    }),
});

/**
 * Schema for POST /api/v1/auth/forgot-password/verify-otp (UC07 Step 2)
 */
export const verifyResetOTPSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
        otp: z.string().length(6, 'Mã OTP phải có 6 chữ số').regex(/^\d{6}$/, 'Mã OTP chỉ chứa chữ số'),
    }),
});

/**
 * Schema for POST /api/v1/auth/forgot-password/reset (UC07 Step 3)
 */
export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
        otp: z.string().length(6, 'Mã OTP phải có 6 chữ số').regex(/^\d{6}$/, 'Mã OTP chỉ chứa chữ số'),
        newPassword: z.string()
            .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
            .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
            .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in thường')
            .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
            .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
    }),
});

export default {
    loginSchema,
    sendOTPSchema,
    verifyOTPSchema,
};
