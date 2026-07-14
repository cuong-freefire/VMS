/**
 * Profile Service
 *
 * Business logic cho Profile Management (UC18 - View Profile, UC19 - Edit Profile).
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import * as profileRepository from "../repositories/profile.repository.js";
import { ServiceError } from "../utils/response.util.js";
import logger from "../config/logger.config.js";

/**
 * Format profile data từ DB entity sang API response.
 */
const formatProfile = (profile) => {
  const skills = (profile.userSkills || []).map((us) => ({
    skill_id: us.skill.id,
    skill_name: us.skill.name,
  }));

  return {
    full_name: profile.fullName,
    email: profile.email,
    phone_number: profile.phone ?? null,
    avatar_url: profile.avatarUrl ?? null,
    role_id: profile.roleId,
    role_name: profile.role.name,
    created_at: profile.createdAt ? profile.createdAt.toISOString() : null,
    skills,
  };
};

/**
 * Lấy thông tin hồ sơ cá nhân của người dùng đã xác thực.
 */
export const getUserProfile = async (userId) => {
  try {
    const profile = await profileRepository.findUserWithSkills(userId);
    if (!profile) throw new ServiceError("Tài khoản không tồn tại", 404, "USER_NOT_FOUND");
    if (!profile.isActive) throw new ServiceError("Tài khoản đã bị vô hiệu hóa", 403, "ACCOUNT_DISABLED");
    return formatProfile(profile);
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error({ userId, error }, "Unexpected error in getUserProfile");
    throw new ServiceError("Có lỗi xảy ra trong quá trình xử lý", 500, "INTERNAL_SERVER_ERROR");
  }
};

/**
 * Cập nhật thông tin hồ sơ cá nhân (UC19 - Edit Profile).
 *
 * data đã được validate + strip bởi validate(updateProfileSchema) trong route.
 * Service KHÔNG validate lại - tránh duplicate.
 *
 * @param {number} userId
 * @param {Object} data - { full_name?, phone_number? } đã validated
 * @param {Express.Multer.File} [file]
 */
export const updateProfile = async (userId, data, file) => {
  try {
    const currentUser = await profileRepository.findUserWithSkills(userId);
    if (!currentUser) throw new ServiceError("Tài khoản không tồn tại", 404, "USER_NOT_FOUND");
    if (!currentUser.isActive) throw new ServiceError("Tài khoản đã bị vô hiệu hóa", 403, "ACCOUNT_DISABLED");

    const finalUpdateData = {};
    if (data.full_name !== undefined) finalUpdateData.fullName = data.full_name;
    if (data.phone_number !== undefined) finalUpdateData.phone = data.phone_number;

    if (file) {
      const { uploadImage, deleteImage, extractPublicId } = await import("./cloudinary.service.js");

      if (currentUser.avatarUrl) {
        const oldPublicId = extractPublicId(currentUser.avatarUrl);
        if (oldPublicId) await deleteImage(oldPublicId);
      }

      let uploadResult;
      try {
        uploadResult = await uploadImage(file.buffer, 'avatars');
      } catch (uploadError) {
        logger.error({ userId, error: uploadError.message }, "Cloudinary upload failed");
        throw new ServiceError("Không thể tải ảnh lên. Vui lòng thử lại sau.", 500, "CLOUDINARY_ERROR");
      }
      finalUpdateData.avatarUrl = uploadResult.secure_url;
    }

    let updatedUser;
    try {
      updatedUser = await profileRepository.updateUser(userId, finalUpdateData);
    } catch (dbError) {
      if (file && finalUpdateData.avatarUrl) {
        try {
          // Nếu upload fail thì xoá ảnh trong cloudinary
          const { extractPublicId, deleteImage } = await import("./cloudinary.service.js");
          const newPublicId = extractPublicId(finalUpdateData.avatarUrl);
          if (newPublicId) await deleteImage(newPublicId);
        } catch (cleanupError) {
          logger.error({ userId, error: cleanupError.message }, "Failed to clean up orphaned image");
        }
      }
      throw dbError;
    }

    const changedFields = Object.keys(finalUpdateData).map((key) => {
      if (key === "fullName") return "full_name";
      if (key === "phone") return "phone_number";
      if (key === "avatarUrl") return "avatar_url";
      return key;
    });
    logger.info({ userId, changedFields }, "Profile updated successfully");

    return formatProfile(updatedUser);
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error({ userId, ERROR: error }, "Unexpected error in updateProfile");
    throw new ServiceError("Có lỗi xảy ra trong quá trình xử lý", 500, "INTERNAL_SERVER_ERROR");
  }
};
