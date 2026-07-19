/**
 * Event Repository - Database operations for Event Management module
 * Owner: Member 5 - DucNM (UC67, UC69, UC70)
 *
 * Responsibilities:
 * - Query events with pagination, status filter, and organization include
 * - Find event by ID (UC69, UC70)
 * - Update event status, approval, and rejection info (UC69)
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find events with pagination and optional where filter.
 * Includes organization name for display.
 *
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {Object} [options.where={}] - Prisma where clause for filtering
 * @returns {Promise<Array>} List of events with organization info
 */
const findEvents = async ({ skip, take, where = {} }) => {
    return prisma.event.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            applicationDeadline: true,
            maxCapacity: true,
            approvedParticipants: true,
            imageUrl: true,
            status: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    categoryType: true
                }
            },
            createdByUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            }
        }
    });
};

/**
 * Count total events matching filter criteria.
 *
 * @param {Object} [where={}] - Prisma where clause for filtering
 * @returns {Promise<number>} Total count of matching events
 */
const countEvents = async (where = {}) => {
    return prisma.event.count({ where });
};

/**
 * Find role name by role ID.
 *
 * @param {number} roleId
 * @returns {Promise<string|null>}
 */
const findRoleNameById = async (roleId) => {
    if (roleId == null) {
        return null;
    }
    const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { name: true }
    });
    return role?.name ?? null;
};

/**
 * Find event by ID.
 * UC69: Approve Event — check event tồn tại.
 *
 * @param {number} id - Event ID
 * @returns {Promise<Object|null>} Event record or null
 */
const findById = async (id) => {
    return prisma.event.findUnique({
        where: { id }
    });
};

/**
 * Update event status and approval info.
 * UC69: Approve Event — update status, approved_by, approved_at.
 * UC70: Reject Event
 * 
 * @param {number} id - Event ID
 * @param {Object} data - Fields to update (status, approvedBy, approvedAt)
 * @returns {Promise<Object>} Updated event
 */
const updateEventStatus = async (id, data) => {
    return prisma.event.update({
        where: { id },
        data,
        select: {
            id: true,
            title: true,
            status: true,
            approvedBy: true,
            approvedAt: true,
            rejectedBy: true,
            rejectedAt: true,
            rejectedReason: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

export default {
    findEvents,
    countEvents,
    findRoleNameById,
    findById,
    updateEventStatus
};