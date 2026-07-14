/**
 * Skill Repository - Database operations for Skill Management module
 * Owner: Member 4 - DucNM (UC34)
 *
 * Responsibilities:
 * - Query all skills
 * - Find skill by name
*  - Create skill
*  - Lookup role name
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find all skills with optional filter.
 *
 * @param {Object} [where={}] - Prisma where clause
 * @returns {Promise<Array>} List of skills
 */
const findAll = async (where = {}) => {
    return prisma.skill.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

export default {
    findAll,
    findRoleNameById,
    findByName,
    createSkill
};