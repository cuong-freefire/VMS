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

export default { findByUserAndEvent };