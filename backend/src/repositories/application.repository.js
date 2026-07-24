import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

export default { findByUserAndEvent, findByIdWithEvent, cancelApplication };
