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

/**
 * Find category by name and type.
 * UC32: Add Category — check uniqueness (cùng name trong cùng type).
 *
 * @param {string} name - Category name
 * @param {string} categoryType - Category type (LOCATION, TIME, TYPE)
 * @returns {Promise<Object|null>} Category record or null
 */
const findByNameAndType = async (name, categoryType) => {
    return prisma.eventCategory.findFirst({
        where: {
            name,
            categoryType
        }
    });
};

/**
 * Create a new category.
 * UC32: Add Category — tạo category mới.
 *
 * @param {Object} data - Category data
 * @param {string} data.name - Category name
 * @param {string} data.categoryType - Category type enum
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created category
 */
const createCategory = async (data) => {
    return prisma.eventCategory.create({
        data: {
            name: data.name,
            categoryType: data.categoryType,
            description: data.description || null
        },
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

export default {
    findAll,
    findRoleNameById,
    findByNameAndType,
    createCategory
};

