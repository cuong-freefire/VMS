/**
 * Skill Repository - Database operations for Skill Management module
 * Owner: Member 4 - DucNM (UC34)
 *
 * Responsibilities:
 * - Query all skills with optional where filter
 *
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

export default {
    findAll
};