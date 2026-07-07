/**
 * Profile Repository
 *
 * Data access layer cho Profile Management (UC18 - View Profile).
 * Tầng duy nhất giao tiếp trực tiếp với Prisma Client.
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tìm user theo ID kèm danh sách kỹ năng đang active.
 * Chỉ select các trường cần thiết cho response, loại bỏ hoàn toàn
 * các trường nhạy cảm ngay từ database layer.
 *
 * @param {number} userId - Định danh người dùng từ JWT đã xác thực
 * @returns {Promise<Object|null>} User object với skills hoặc null nếu không tìm thấy
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
        where: {
          skill: { isActive: true },
        },
        select: {
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
};