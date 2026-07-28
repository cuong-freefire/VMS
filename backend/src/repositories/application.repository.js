/**
 * Application Repository - Database operations for Application Management module
 * Owner: Member 4 - DucNM (UC22, UC23, UC24)
 *
 * Responsibilities:
 * - Find applications by event ID with pagination and status filter
 * - Count applications by event ID for pagination metadata
 * - Include volunteer (user) information
 * - Update application status
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
 * Find application by ID.
 * UC24: Approve Application — validate application exists and get event info.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
    return prisma.application.findUnique({
        where: { id },
        select: {
            id: true,
            eventId: true,
            status: true,
            event: {
                select: {
                    id: true,
                    createdBy: true,
                    maxCapacity: true,
                    approvedParticipants: true
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

/**
 * Find application detail by ID with full volunteer and event info.
 * UC23: View Application Detail — lấy chi tiết application kèm volunteer profile và event info.
 *
 * @param {number} applicationId - Application ID
 * @returns {Promise<Object|null>} Application with volunteer and event info, or null
 */
const findDetailById = async (id) => {
    return prisma.application.findUnique({
        where: { id },
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
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    userSkills: {
                        select: {
                            skill: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            event: {
                select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    createdBy: true
                }
            }
        }
    });
};

/**
 * Update application status with processed info.
 * UC24: Approve Application — update status, processedBy, processedAt.
 *
 * @param {number} id - Application ID
 * @param {Object} data - Fields to update (status, processedBy, processedAt)
 * @returns {Promise<Object>} Updated application record
 */
const updateApplicationStatus = async (id, data) => {
    return prisma.application.update({
        where: { id },
        data,
        select: {
            id: true,
            userId: true,
            eventId: true,
            status: true,
            message: true,
            processedBy: true,
            processedAt: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

export default {
    findByEventId,
    findById,
    countByEventId,
    findDetailById,
    updateApplicationStatus
};
