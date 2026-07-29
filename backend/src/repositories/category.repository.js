/**
 * Category Repository - Database operations for Category Management module
 * Owner: Member 4 - DucNM (UC31, UC32, UC33, UC-feat-search-category)
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
 * Find category by ID.
 * UC33: Edit Category — check category tồn tại.
 *
 * @param {number} id - Category ID
 * @returns {Promise<Object|null>} Category record or null
 */
const findById = async (id) => {
    return prisma.eventCategory.findUnique({
        where: { id }
    });
};

/**
 * Find category by name and type, optionally exclude a specific ID.
 * UC32: Add Category — check uniqueness (cùng name trong cùng type).
 * UC33: Edit Category — check uniqueness khi đổi tên, exclude chính category đang edit.
 *
 * @param {string} name - Category name
 * @param {string} categoryType - Category type (LOCATION, TIME, TYPE)
 * @param {number} [excludeId] - Optional ID to exclude (for edit)
 * @returns {Promise<Object|null>} Category record or null
 */
const findByNameAndType = async (name, categoryType, excludeId) => {
    const where = {
        name,
        categoryType
    };

    if (excludeId !== undefined) {
        where.NOT = { id: excludeId };
    }

    return prisma.eventCategory.findFirst({ where });
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

/**
 * Update a category by ID.
 * UC33: Edit Category — update thông tin category.
 *
 * @param {number} id - Category ID
 * @param {Object} data - Fields to update
 * @param {string} [data.name] - Category name
 * @param {string} [data.description] - Description
 * @param {boolean} [data.isActive] - Active status
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (id, data) => {
    return prisma.eventCategory.update({
        where: { id },
        data,
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
    createCategory,
    findById,
    updateCategory
};

