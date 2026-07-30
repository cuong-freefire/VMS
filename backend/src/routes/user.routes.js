/**
 * User Routes
 *
 * Các endpoint liên quan đến quản lý người dùng (User Management):
 * - GET /users: Danh sách người dùng (UC26 - View User List, UC30 - Filter User)
 * - GET /users/:id: Chi tiết người dùng (UC27 - View User Detail)
 * - POST /users: Tạo người dùng mới (UC28 - Add User)
 * - PATCH /users/:id: Cập nhật thông tin người dùng (UC29 - Edit User)
 *
 * Ngoài ra còn có các endpoint hồ sơ cá nhân (Profile Management):
 * - GET /user/me: Xem hồ sơ cá nhân (UC18 - View Profile)
 * - PATCH /user/me: Cập nhật hồ sơ cá nhân (UC19 - Edit Profile)
 * - GET /user/me/history: Lịch sử tình nguyện (UC021)
 *
 * Prefix: /api/v1 (mount tại app.js)
 *
 * Owner: Member 1 - CuongLH
 * Module: User Management & Profile Management
 */

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import uploadMiddleware from "../middlewares/upload.middleware.js";
import { getUsersHandler, getUserByIdHandler, createUserHandler, updateUserHandler } from "../controllers/user.controller.js";
import { updateProfileSchema, validateVolunteerHistoryQuery } from "../middlewares/validators/profile.validator.js";
import { getMyProfile, updateMyProfile, getMyHistory } from "../controllers/profile.controller.js";
import { errorResponse } from "../utils/response.util.js";
import { validate, validateQuery, validateParams } from "../middlewares/validators/validate.js";
import { getUsersSchema, userIdSchema, createUserSchema, updateUserSchema } from "../middlewares/validators/user.validator.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

/**
 * GET /api/v1/user/me
 * Xem hồ sơ cá nhân (UC18 - View Profile)
 */
router.get("/me", authMiddleware, getMyProfile);

/**
 * GET /api/v1/user/me/history
 * Xem lịch sử tham gia tình nguyện (UC021 - Volunteer History)
 */
router.get("/me/history", authMiddleware, validateVolunteerHistoryQuery, getMyHistory);

/**
 * Multer error handler wrapper.
 */
const handleMulterUpload = (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json(
                    errorResponse("Dung lượng file vượt quá giới hạn 5MB", "LIMIT_FILE_SIZE")
                );
            }
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json(
                    errorResponse(err.message || "Chỉ hỗ trợ định dạng jpg, jpeg, png", "INVALID_FILE_TYPE")
                );
            }
            return res.status(400).json(
                errorResponse(err.message || "Lỗi upload file", "UPLOAD_ERROR")
            );
        }
        next();
    });
};

/**
 * PATCH /api/v1/user/me
 * Cập nhật hồ sơ cá nhân (UC19 - Edit Profile)
 */
router.patch(
    "/me",
    authMiddleware,
    handleMulterUpload,
    validate(updateProfileSchema),
    updateMyProfile
);

/**
 * GET /api/v1/users
 * Lấy danh sách người dùng (Admin only)
 * UC26: View User List, UC30: Filter User
 */
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validateQuery(getUsersSchema),
    getUsersHandler
);

/**
 * POST /api/v1/users
 * Tạo người dùng mới (Admin only)
 * UC28: Add User
 */
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validate(createUserSchema),
    createUserHandler
);

/**
 * GET /api/v1/users/:id
 * Lấy thông tin chi tiết người dùng (Admin only)
 * UC27: View User Detail
 */
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validateParams(userIdSchema),
    getUserByIdHandler
);

/**
 * PATCH /api/v1/users/:id
 * Cập nhật thông tin người dùng (Admin only)
 * UC29: Edit User
 */
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validateParams(userIdSchema),
    validate(updateUserSchema),
    updateUserHandler
);

export default router;