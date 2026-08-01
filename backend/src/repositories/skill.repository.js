/**
 * Skill Repository - Database operations for Skill Management module
 * Owner: Member 4 - DucNM (UC34, UC35, UC36, UC-feat-search-skill)
 *
 * Responsibilities:
 * - Query all skills
 * - Find skill by name
*  - Create skill
 * - Find skill by ID
 * - Update skill
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find skills with pagination, search, filter and sort.
 *
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {Object} options.where - Prisma where clause for filtering
 * @param {Object} options.orderBy - Prisma orderBy clause for sorting
 * @returns {Promise<Array>} List of skills
 */
const findMany = async ({ skip, take, where, orderBy }) => {
    return prisma.skill.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

/**
 * Count total skills matching filter criteria.
 *
 * @param {Object} where - Prisma where clause for filtering
 * @returns {Promise<number>} Total count of matching skills
 */
const count = async (where) => {
    return prisma.skill.count({ where });
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
 * Find skill by name.
 * UC35: Add Skill — check uniqueness (name unique trên toàn bảng).
 *
 * @param {string} name - Skill name
 * @returns {Promise<Object|null>} Skill record or null
 */
const findByName = async (name) => {
    return prisma.skill.findUnique({
        where: { name }
    });
};

/**
 * Create a new skill.
 * UC35: Add Skill — tạo skill mới.
 *
 * @param {Object} data - Skill data
 * @param {string} data.name - Skill name
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created skill
 */
const createSkill = async (data) => {
    return prisma.skill.create({
        data: {
            name: data.name,
            description: data.description || null
        },
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

/**
 * Find skill by ID.
 * UC36: Edit Skill — check skill tồn tại.
 *
 * @param {number} id - Skill ID
 * @returns {Promise<Object|null>} Skill record or null
 */
const findById = async (id) => {
    return prisma.skill.findUnique({
        where: { id }
    });
};

/**
 * Find skill by name, excluding a specific ID.
 * UC36: Edit Skill — check uniqueness khi đổi tên, exclude chính skill đang edit.
 *
 * @param {string} name - Skill name
 * @param {number} excludeId - ID to exclude
 * @returns {Promise<Object|null>} Skill record or null
 */
const findByNameExcluding = async (name, excludeId) => {
    return prisma.skill.findFirst({
        where: {
            name,
            NOT: { id: excludeId }
        }
    });
};

/**
 * Update a skill by ID.
 * UC36: Edit Skill — update thông tin skill.
 *
 * @param {number} id - Skill ID
 * @param {Object} data - Fields to update
 * @param {string} [data.name] - Skill name
 * @param {string} [data.description] - Description
 * @param {boolean} [data.isActive] - Active status
 * @returns {Promise<Object>} Updated skill
 */
const updateSkill = async (id, data) => {
    return prisma.skill.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

export default {
    findMany,
    count,
    findRoleNameById,
    findByName,
    createSkill,
    findById,
    findByNameExcluding,
    updateSkill
};