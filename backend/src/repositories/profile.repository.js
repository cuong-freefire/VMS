/**
 * Profile Repository
 *
 * Data access layer cho Profile Management.
 * Là nơi DUY NHẤT giao tiếp với Database thông qua Prisma Client.
 * TUYỆT ĐỐI KHÔNG chứa business logic (AGENTS.md Section 6 - ADR-001).
 *
 * Schema version: 3.0 (Reduced Scope)
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tìm user theo id, kèm theo userSkills -> skill.
 *
 * @param {number} userId
 * @returns {Promise<Object|null>} User object hoặc null nếu không tìm thấy
 */
export async function findUserWithSkills(userId) {
  return prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      role: true,
      userSkills: {
        include: {
          skill: true
        },
      },
    },
  });
}

/**
 * Cập nhật thông tin profile của user (chỉ các field được phép).
 *
 * @param {number} userId
 * @param {Object} data - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} User object đã được cập nhật
 */
export async function updateUserProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data,
    include: {
      role: true,
      userSkills: {
        include: {
          skill: true,
        },
      },
    },
  });
}

/**
 * UC021 — Lấy danh sách đơn đăng ký của volunteer
 * kèm thông tin sự kiện.
 * (Schema v3 không còn attendance, certificate, feedback, organization)
 *
 * @param {number} userId
 * @param {Object} filters - { status, year, skip, take }
 * @returns {Promise<Array>} Danh sách application kèm event
 */
export async function findVolunteerHistory(userId, filters = {}) {
  const { status, search, year, skip = 0, take = 10 } = filters;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  const eventWhere = {};
  if (year) {
    eventWhere.startDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${Number(year) + 1}-01-01`),
    };
  }

  const applications = await prisma.application.findMany({
    where: {
      ...where,
      event: Object.keys(eventWhere).length > 0 ? eventWhere : undefined,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });

  let result = applications;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((app) =>
      app.event && (
        app.event.title.toLowerCase().includes(q) ||
        app.event.location.toLowerCase().includes(q)
      )
    );
  }

  if (!year) return result;

  return result.filter((app) => {
    if (!app.event || !app.event.startDate) return false;
    const eventYear = new Date(app.event.startDate).getFullYear();
    return eventYear === year;
  });
}

/**
 * UC021 — Đếm tổng số application của volunteer (để phân trang).
 *
 * @param {number} userId
 * @param {Object} filters - { status, year }
 * @returns {Promise<number>}
 */
export async function countHistoryApplications(userId, filters = {}) {
  const { status, search, year } = filters;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  if (!year) {
    return prisma.application.count({ where });
  }

  const allApplications = await prisma.application.findMany({
    where,
    include: {
      event: {
        select: {
          startDate: true,
        },
      },
    },
  });

  return allApplications.filter((app) => {
    if (!app.event || !app.event.startDate) return false;
    const eventYear = new Date(app.event.startDate).getFullYear();
    return eventYear === year;
  }).length;
}