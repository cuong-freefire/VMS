/**
 * Profile Repository
 *
 * Data access layer cho Profile Management (UC18 - View Profile, UC19 - Edit Profile).
 * Tầng duy nhất giao tiếp trực tiếp với Prisma Client.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tìm user theo ID kèm danh sách kỹ năng đang active.
 */
export const findUserWithSkills = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      userSkills: {
        where: { skill: { isActive: true } },
        select: { skill: { select: { id: true, name: true } } },
      },
    },
  });
};

/**
 * Cập nhật thông tin user trong database.
 * Chỉ select các field an toàn, TUYỆT ĐỐI KHÔNG select passwordHash, roleId.
 *
 * @param {number} userId
 * @param {Object} updateData - Các field cần cập nhật (fullName, phone, avatarUrl)
 * @returns {Promise<Object>} User đã cập nhật kèm skills
 */
export const updateUser = async (userId, updateData) => {
  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      userSkills: {
        where: { skill: { isActive: true } },
        select: { skill: { select: { id: true, name: true } } },
      },
    },
  });
};
