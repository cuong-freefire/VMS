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
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse({
                body: req.body,
            });
            req.body = validated.body;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues
                    .map((err) => `${err.path.join('.')}: ${err.message}`)
                    .join('; ');
                return res.status(400).json({
                    success: false,
                    error: errorMessages,
                });
            }
            next(error);
        }
    };
};

export default {
    sendOTPSchema,
    verifyOTPSchema,
    validate,
};
