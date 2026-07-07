/**
 * Profile Controller
 *
 * HTTP layer cho Profile Management (UC18 - View Profile, UC19 - Edit Profile).
 * Nhận request, gọi Service, format response.
 * KHÔNG chứa business logic (tuân thủ AGENTS.md Section 6).
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { getUserProfile, updateProfile } from "../services/profile.service.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

/**
 * GET /api/v1/user/me
 *
 * Xem hồ sơ cá nhân của chính mình (Private Profile).
 * userId được lấy từ req.user.user_id (JWT đã xác thực bởi authMiddleware).
 * TUYỆT ĐỐI KHÔNG nhận userId từ request params/body (Lesson 3).
 */
export async function getMyProfile(req, res) {
  try {
    const { user_id } = req.user;
    const profile = await getUserProfile(user_id);

    return res
      .status(200)
      .json(successResponse(profile, "Lấy thông tin hồ sơ thành công"));
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
 * PATCH /api/v1/user/me
 *
 * Cập nhật hồ sơ cá nhân của chính mình (UC19 - Edit Profile).
 * userId được lấy từ req.user.user_id (JWT đã xác thực bởi authMiddleware).
 * TUYỆT ĐỐI KHÔNG nhận userId từ request params/body (Lesson 3 - Anti-IDOR).
 * Hỗ trợ multipart/form-data (có file ảnh) và application/json (chỉ text).
 */
export async function updateMyProfile(req, res) {
  try {
    const { user_id } = req.user;
    // const  user_id  = 1;
    const profile = await updateProfile(user_id, req.body, req.file);

    return res
      .status(200)
      .json(successResponse(profile, "Cập nhật hồ sơ thành công"));
  } catch (error) {
    if (error.status === 413) {
      return res
        .status(413)
        .json(
          errorResponse(
            "Dung lượng file vượt quá giới hạn 5MB",
            "LIMIT_FILE_SIZE"
          )
        );
    }

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
