/**
 * Application Repository - Database operations for Application Management module
 * Owner: Member 1 - CuongLH (UC10, UC14)
 * Owner: Member 4 - DucNM (UC22, UC23, UC24, UC25)
 *
 * Responsibilities:
 * - UC10: Find/create applications for volunteer submission
 * - UC14: Find/cancel applications for volunteer cancellation
 * - UC22: Find applications by event ID with pagination and status filter
 * - UC23: Find application detail with full volunteer and event info
 * - UC24: Update application status (approve/reject)
 * - UC25: Update application status (reject)
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── UC10-UC14: Volunteer-facing application queries ─────────────────

/**
 * Find an application by userId and eventId.
 * Only returns active applications (status != CANCELLED).
 *
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<object|null>} Application record, or null.
 */
export async function findByUserAndEvent(userId, eventId) {
  return prisma.application.findFirst({
    where: {
      userId,
      eventId,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });
}

/**
 * Find an active application by userId and eventId.
 * "Active" means status is NOT in terminal states that allow re-apply:
 *   - CANCELLED (user tự hủy → được apply lại)
 *   - PAYMENT_EXPIRED (hết hạn thanh toán → được apply lại)
 * Terminal states that BLOCK re-apply: REJECTED.
 *
 * @param {object} tx - Prisma transaction client (or prisma for standalone)
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<object|null>} Active application, or null.
 */
export async function findActiveByUserAndEvent(tx, userId, eventId) {
  return tx.application.findFirst({
    where: {
      userId,
      eventId,
      status: { notIn: ["CANCELLED", "PAYMENT_EXPIRED"] },
    },
    select: {
      id: true,
      status: true,
    },
  });
}

/**
 * Create a new application. Must be called inside a Prisma transaction.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.eventId
 * @param {string}  params.status - Initial status (always PENDING for new applications)
 * @param {string?} params.message - Optional message from volunteer
 * @returns {Promise<object>} Created application
 */
export async function createApplication(tx, { userId, eventId, status, message }) {
  return tx.application.create({
    data: {
      userId,
      eventId,
      status,
      message: message || null,
    },
    select: {
      id: true,
      userId: true,
      eventId: true,
      status: true,
      message: true,
      createdAt: true,
    },
  });
}

/**
 * Find application by ID with related event data.
 * Used by cancel flow to validate event state (not InProgress/Completed).
 *
 * @param {number} applicationId
 * @returns {Promise<object|null>} Application with event, or null.
 */
export async function findByIdWithEvent(applicationId) {
  return prisma.application.findFirst({
    where: { id: applicationId, status: { not: "CANCELLED" } },
    include: {
      event: {
        select: { id: true, status: true, startDate: true },
      },
    },
  });
}

/**
 * Cancel (set status = CANCELLED) an application.
 * Must be called inside a Prisma transaction.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {number} applicationId
 * @returns {Promise<object>} Updated application
 */
export async function cancelApplication(tx, applicationId) {
  return tx.application.update({
    where: { id: applicationId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Find a payment transaction by application ID.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {number} applicationId
 * @returns {Promise<object|null>} PaymentTransaction, or null.
 */
export async function findPaymentByApplicationId(tx, applicationId) {
  return tx.paymentTransaction.findFirst({
    where: { applicationId },
    select: { id: true, status: true, vnpTxnRef: true },
  });
}

// ─── UC22-UC25: Staff-facing application queries ─────────────────────

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

export {
    findByUserAndEvent,
    findActiveByUserAndEvent,
    createApplication,
    findByIdWithEvent,
    cancelApplication,
    findPaymentByApplicationId,
    findByEventId,
    findById,
    countByEventId,
    findDetailById,
    updateApplicationStatus
};

export default {
    findByUserAndEvent,
    findActiveByUserAndEvent,
    createApplication,
    findByIdWithEvent,
    cancelApplication,
    findPaymentByApplicationId,
    findByEventId,
    findById,
    countByEventId,
    findDetailById,
    updateApplicationStatus
};