/**
 * Application Repository - Database operations for Application Management module
 * Owner: Member 4 - DucNM (UC22)
 *
 * Responsibilities:
 * - Find applications by event ID with pagination and status filter
 * - Count applications by event ID for pagination metadata
 * - Include volunteer (user) information
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find applications by event ID with pagination and optional status filter.
 * Includes volunteer user information (id, fullName, avatarUrl).
 *
 * @param {number} eventId - Event ID
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {string} [options.status] - Optional status filter
 * @returns {Promise<Array>} List of applications with volunteer info
 */
const findByEventId = async (eventId, { skip, take, status }) => {
    const where = { eventId };

    if (status) {
        where.status = status.toUpperCase();
    }

    return prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            userId: true,
            eventId: true,
            status: true,
            message: true,
            processedBy: true,
            processedAt: true,
            createdAt: true,
            updatedAt: true,
            submittedByUser: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        }
    });
};

/**
 * Count applications by event ID with optional status filter.
 *
 * @param {number} eventId - Event ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<number>} Total count of matching applications
 */
const countByEventId = async (eventId, status) => {
    const where = { eventId };

    if (status) {
        where.status = status.toUpperCase();
    }

    return prisma.application.count({ where });
};

export default {
    findByEventId,
    countByEventId
};