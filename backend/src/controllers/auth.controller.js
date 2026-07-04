import { loginService, sendOTP, verifyOTP } from "../services/auth.service.js";
import { setTokenToCookie } from "../utils/jwt.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

/**
 * POST /api/v1/auth/login
 * Authenticate user with email and password
 * 
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     description: |
 *       Xác thực người dùng bằng email và password.
 *       Nếu thành công, JWT token sẽ được trả về trong httpOnly cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: volunteer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "vms_access_token=<JWT>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role_id:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account disabled or email not verified
 *       429:
 *         description: Account locked (too many failed attempts)
 *       500:
 *         description: Server error
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const { token, user } = await loginService(email, password);
        
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

/**
 * POST /api/v1/auth/register/send-otp
 * Send OTP to email for registration
 * @swagger
 * /api/v1/auth/register/send-otp:
 *   post:
 *     summary: Send OTP to email for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     cooldown_seconds:
 *                       type: number
 *       400:
 *         description: Invalid email format
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Cooldown or lockout active
 *       503:
 *         description: Email service unavailable
 */
export async function sendOTPController(req, res) {
    try {
        const { email } = req.body;
        const result = await sendOTP(email);
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

/**
 * POST /api/v1/auth/register/verify-otp
 * Verify OTP and create user account
 * @swagger
 * /api/v1/auth/register/verify-otp:
 *   post:
 *     summary: Verify OTP and complete registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+84912345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *             required:
 *               - email
 *               - otp
 *               - fullName
 *               - phoneNumber
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     userId:
 *                       type: number
 *       400:
 *         description: Invalid OTP or validation error
 *       429:
 *         description: Email locked due to failed attempts
 *       500:
 *         description: Server error
 */
export async function verifyOTPController(req, res) {
    try {
        const { email, otp, fullName, phoneNumber, password } = req.body;
        const result = await verifyOTP({
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
