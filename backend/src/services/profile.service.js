/**
 * Profile Service
 *
 * Business logic cho Profile Management (UC18 - View Profile, UC19 - Edit Profile, UC021 - Volunteer History).
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import * as profileRepository from "../repositories/profile.repository.js";
import { ServiceError } from "../utils/response.util.js";
import logger from "../config/logger.config.js";

/**
 * Format profile data tá»« DB entity sang API response.
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
    is_active: profile.isActive,
    created_at: profile.createdAt ? profile.createdAt.toISOString() : null,
    skills,
  };
};

/**
 * Láº¥y thÃ´ng tin há»“ sÆ¡ cÃ¡ nhÃ¢n cá»§a ngÆ°á»i dÃ¹ng Ä‘Ã£ xÃ¡c thá»±c.
 */
export const getUserProfile = async (userId) => {
  try {
    const profile = await profileRepository.findUserWithSkills(userId);
    if (!profile) throw new ServiceError("TÃ i khoáº£n khÃ´ng tá»“n táº¡i", 404, "USER_NOT_FOUND");
    if (!profile.isActive) throw new ServiceError("TÃ i khoáº£n Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a", 403, "ACCOUNT_DISABLED");
    return formatProfile(profile);
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error({ userId, err: error }, "Unexpected error in getUserProfile");
    throw new ServiceError("CÃ³ lá»—i xáº£y ra trong quÃ¡ trÃ¬nh xá»­ lÃ½", 500, "INTERNAL_SERVER_ERROR");
  }
};

/**
 * UC021 â€” Láº¥y lá»‹ch sá»­ tham gia tÃ¬nh nguyá»‡n cá»§a Volunteer
 *
 * Schema V3.0: volunteer_application â†’ event (bá» join attendance/certificate vÃ¬ schema má»›i chÆ°a cÃ³ báº£ng Ä‘Ã³)
 *
 * @param {number} userId
 * @param {Object} filters â€” { status?, year?, page?, limit? } tá»« query params Ä‘Ã£ validated
 * @returns {Promise<{ history, pagination, summary }>}
 */
export const getVolunteerHistory = async (userId, filters) => {
  try {
    const user = await profileRepository.findUserWithSkills(userId);
    if (!user) throw new ServiceError("TÃ i khoáº£n khÃ´ng tá»“n táº¡i", 404, "USER_NOT_FOUND");
    if (!user.isActive) throw new ServiceError("TÃ i khoáº£n Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a", 403, "ACCOUNT_DISABLED");

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const repoFilters = {
      status: filters.status,
      search: filters.search,
      year: filters.year ? parseInt(filters.year, 10) : undefined,
      skip,
      take: limit,
    };

    const [applications, total, summaryTotal, approvedCount] = await Promise.all([
      profileRepository.findVolunteerHistory(userId, repoFilters),
      profileRepository.countHistoryApplications(userId, { status: filters.status, year: filters.year ? parseInt(filters.year, 10) : undefined }),
      profileRepository.countHistoryApplications(userId, {}),
      profileRepository.countHistoryApplications(userId, { status: "APPROVED", year: filters.year ? parseInt(filters.year, 10) : undefined }),
    ]);

    // Map application â†’ history item (Schema V3.0 â€” chá»‰ join Event)
    const history = applications.map((app) => ({
      id: app.id,
      status: app.status,
      applied_at: app.createdAt.toISOString(),
      event: app.event ? {
        id: app.event.id,
        title: app.event.title,
        start_date: app.event.startDate.toISOString(),
        location: app.event.location,
      } : null,
    }));

    return {
      history,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      summary: { total: summaryTotal, approved: approvedCount },
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error({ userId, err: error }, "Unexpected error in getVolunteerHistory");
    throw new ServiceError("CÃ³ lá»—i xáº£y ra trong quÃ¡ trÃ¬nh xá»­ lÃ½", 500, "INTERNAL_SERVER_ERROR");
  }
};

/**
 * Cáº­p nháº­t thÃ´ng tin há»“ sÆ¡ cÃ¡ nhÃ¢n (UC19 - Edit Profile).
 *
 * data Ä‘Ã£ Ä‘Æ°á»£c validate + strip bá»Ÿi validate(updateProfileSchema) trong route.
 * Service KHÃ”NG validate láº¡i - trÃ¡nh duplicate.
 *
 * @param {number} userId
 * @param {Object} data - { full_name?, phone_number? } Ä‘Ã£ validated
 * @param {Express.Multer.File} [file]
 */
export const updateProfile = async (userId, data, file) => {
  try {
    logger.info({ userId, bodyKeys: Object.keys(data || {}) }, 'updateProfile called');
    const currentUser = await profileRepository.findUserWithSkills(userId);
    if (!currentUser) throw new ServiceError("TÃ i khoáº£n khÃ´ng tá»“n táº¡i", 404, "USER_NOT_FOUND");
    if (!currentUser.isActive) throw new ServiceError("TÃ i khoáº£n Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a", 403, "ACCOUNT_DISABLED");

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
        throw new ServiceError("KhÃ´ng thá»ƒ táº£i áº£nh lÃªn. Vui lÃ²ng thá»­ láº¡i sau.", 500, "CLOUDINARY_ERROR");
      }
      finalUpdateData.avatarUrl = uploadResult.secure_url;
    }

    let updatedUser;
    try {
      updatedUser = await profileRepository.updateUserProfile(userId, finalUpdateData);
    } catch (dbError) {
      if (file && finalUpdateData.avatarUrl) {
        try {
          // Náº¿u upload fail thÃ¬ xoÃ¡ áº£nh trong cloudinary
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
    throw new ServiceError("CÃ³ lá»—i xáº£y ra trong quÃ¡ trÃ¬nh xá»­ lÃ½", 500, "INTERNAL_SERVER_ERROR");
  }
};
