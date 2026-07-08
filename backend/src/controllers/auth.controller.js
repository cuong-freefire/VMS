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

export async function requestResetPassword(req, res) {
    try {
        const { email } = req.body;
        const result = await authService.requestResetPassword(email);
        return res.status(200).json(successResponse(result, result.message));
    } catch (error) {
        return res.status(error.status || 500).json(
            errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR", error.details)
        );
    }
}

export async function verifyResetOTP(req, res) {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyResetOTP(email, otp);
        return res.status(200).json(successResponse(result, result.message));
    } catch (error) {
        return res.status(error.status || 500).json(
            errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR", error.details)
        );
    }
}

export async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await authService.resetPassword(email, otp, newPassword);
        return res.status(200).json(successResponse(result, result.message));
    } catch (error) {
        return res.status(error.status || 500).json(
            errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR", error.details)
        );
    }
}


/**
 * Change password controller
 * Implements UC06: Thay doi mat khau
 * userId from JWT token (anti-IDOR: NEVER from request body)
 */
export async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.user_id;
        // const userId = 1;

        const result = await authService.changePassword(userId, oldPassword, newPassword);
        return res.status(200).json(successResponse(result, result.message));
    } catch (error) {
        return res.status(error.status || 500).json(
            errorResponse(error.message, error.code || "INTERNAL_SERVER_ERROR", error.details)
        );
    }
}

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