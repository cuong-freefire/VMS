/**
 * Event Repository - Database operations for Event Management module
 * Owner: Member 5 - DucNM (UC15, UC16, UC67, UC69, UC70)
 *
 * Responsibilities:
 * - Query events with pagination, status filter, category and creator information
 * - Find event by ID (UC69, UC70)
 * - Update event status, approval, and rejection info (UC69)
 * - Create event
 * - Find category
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find events with pagination and optional where filter.
 * Includes category and creator information.
 *
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {Object} [options.where={}] - Prisma where clause for filtering
 * @returns {Promise<Array>} List of events with category and creator information
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
 * - UC16: Edit Event — validate event exists and ownership.
 * - UC69: Approve Event — validate event exists.
 * - UC70: Reject Event — validate event exists.
 *
 * @param {number} id - Event ID
 * @returns {Promise<Object|null>} Event record or null
 */
const findById = async (id) => {
    return prisma.event.findUnique({
        where: { id },
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
            categoryId: true,
            status: true,
            isActive: true,
            createdBy: true,
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

/**
 * Create a new event record.
 * UC15: Add Event — Staff tạo sự kiện mới với trạng thái DRAFT.
 *
 * @param {Object} data - Event data to create
 * @returns {Promise<Object>} Created event record
 */
const createEvent = async (data) => {
    return prisma.event.create({
        data,
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
            categoryId: true,
            createdBy: true,
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
 * Find active event category by ID.
 * UC15: Add Event — validate category exists before creating event.
 *
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object|null>} Category record or null
 */
const findCategoryById = async (categoryId) => {
    return prisma.eventCategory.findUnique({
        where: { id: categoryId },
        select: {
            id: true,
            name: true,
            isActive: true
        }
    });
};

/**
 * Update an existing event record.
 * UC16: Edit Event — Staff cập nhật thông tin sự kiện.
 *
 * @param {number} id - Event ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated event record
 */
const updateEvent = async (id, data) => {
    return prisma.event.update({
        where: { id },
        data,
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
            categoryId: true,
            status: true,
            isActive: true,
            createdBy: true,
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
 * Soft delete an event by setting isActive = false.
 * UC17: Delete Event — Soft delete via isActive flag.
 *
 * Business rule:
 * - Physical delete is NOT allowed.
 * - Event remains in database.
 * @param {number} id - Event ID
 * @returns {Promise<Object>} Updated event record
 */
const softDeleteEvent = async (id) => {
    return prisma.event.update({
        where: { id },
        data: {
            isActive: false
        },
        select: {
            id: true,
            title: true,
            status: true,
            isActive: true,
            updatedAt: true
        }
    });
};

/**
 * Count applications for an event.
 * UC17: Delete Event — check if event has any applications before deleting.
 *
 * @param {number} eventId - Event ID
 * @returns {Promise<number>} Count of applications
 */
const countApplications = async (eventId) => {
    return prisma.application.count({
        where: { eventId }
    });
};

export default {
    findEvents,
    countEvents,
    findRoleNameById,
    findById,
    updateEventStatus,
    createEvent,
    findCategoryById,
    updateEvent,
    softDeleteEvent,
    countApplications
};
