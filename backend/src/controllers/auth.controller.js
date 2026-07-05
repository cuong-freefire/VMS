import authService from "../services/auth.service.js";
import { setTokenToCookie } from "../utils/jwt.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const { token, user } = await authService.loginService(email, password);

        // Set JWT in HttpOnly cookie
        setTokenToCookie(res, token);

        return res.status(200).json(successResponse(
            { user },
            'Đăng nhập thành công'
        ));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || "INTERNAL_SERVER_ERROR",
                    error.details
                )
            );
    }
}

export async function sendOTPController(req, res) {
    try {
        const { email } = req.body;
        const result = await authService.sendOTP(email);
        return res.status(200).json(successResponse(result, result.message));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || "INTERNAL_SERVER_ERROR",
                    error.details
                )
            );
    }
}

export async function verifyOTPController(req, res) {
    try {
        const { email, otp, fullName, phoneNumber, password } = req.body;
        const result = await authService.verifyOTP({
            email,
            otp,
            fullName,
            phoneNumber,
            password,
        });
        return res.status(201).json(successResponse(result, result.message));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || "INTERNAL_SERVER_ERROR",
                    error.details
                )
            );
    }
}

/**
 * Logout controller - Clear JWT cookie
 * Implements UC05: User Story 1
 * Idempotent design: always returns 200 regardless of auth state.
 * Stateless JWT - no server-side session invalidation.
 * Token cleared from browser via clearCookie, expires naturally.
 */
export async function logout(req, res) {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.status(200).json(
            successResponse({}, 'Đăng xuất thành công')
        );
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || 'INTERNAL_SERVER_ERROR',
                    error.details
                )
            );
    }
}