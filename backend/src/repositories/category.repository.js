/**
 * Category Repository - Database operations for Category Management module
 * Owner: Member 4 - DucNM (UC31)
 *
 * Responsibilities:
 * - Query all categories with optional where filter
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find all categories với điều kiện lọc.
 *
 * @param {Object} [where={}] - Prisma where clause
 * @returns {Promise<Array>} List of categories
 */
const findAll = async (where = {}) => {
    return prisma.eventCategory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            categoryType: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

/**
 * Find role name by role ID.
 *
 * @param {number} roleId
 * @returns {Promise<string|null>}
 */
const findRoleNameById = async (roleId) => {
    const role = await prisma.role.findUnique({
        where: {
            id: roleId
        },
        select: {
            name: true
        }
    });

    return role?.name ?? null;
};

export default {
    findAll,
    findRoleNameById
};

