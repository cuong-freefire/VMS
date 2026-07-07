/**
 * Profile Service
 *
 * Business logic cho Profile Management (UC18 - View Profile).
 * Xử lý data sanitization, validation, và transformation.
 * Service layer là nơi duy nhất chứa business rules.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import * as profileRepository from "../repositories/profile.repository.js";
import { ServiceError } from "../utils/response.util.js";
import logger from "../config/logger.config.js";

/**
 * Lấy thông tin hồ sơ cá nhân của người dùng đã xác thực.
 *
 * Business Rules:
 * - Chỉ trả về dữ liệu của chính người dùng (self-view only)
 * - Từ chối nếu tài khoản không tồn tại (404)
 * - Từ chối nếu tài khoản bị vô hiệu hóa (403)
 * - Chỉ trả về skills có isActive = true
 * - Loại bỏ tất cả trường nhạy cảm (password_hash, role_id, ...)
 * - Trường optional (phone, avatar) trả về null nếu không có
 * - Mảng skills trả về [] nếu không có kỹ năng
 *
 * @param {number} userId - Định danh người dùng từ JWT đã xác thực
 * @returns {Promise<Object>} ProfileData đã được sanitize
 * @throws {ServiceError} USER_NOT_FOUND (404) hoặc ACCOUNT_DISABLED (403)
 */
export const getUserProfile = async (userId) => {
  try {
    const profile = await profileRepository.findUserWithSkills(userId);

    if (!profile) {
      throw new ServiceError(
        "Tài khoản không tồn tại",
        404,
        "USER_NOT_FOUND"
      );
    }

    if (!profile.isActive) {
      throw new ServiceError(
        "Tài khoản đã bị vô hiệu hóa",
        403,
        "ACCOUNT_DISABLED"
      );
    }

    const skills = profile.userSkills.map((us) => ({
      skill_id: us.skill.id,
      skill_name: us.skill.name,
    }));

    return {
      full_name: profile.fullName,
      email: profile.email,
      phone_number: profile.phone ?? null,
      avatar_url: profile.avatarUrl ?? null,
      skills,
    };
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    logger.error("Unexpected error in getUserProfile", { userId, error });
    throw new ServiceError(
      "Có lỗi xảy ra trong quá trình xử lý",
      500,
      "INTERNAL_SERVER_ERROR",
      process.env.NODE_ENV === "development" ? error.message : null
    );
  }
};