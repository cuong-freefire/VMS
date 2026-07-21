import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Find an event by ID with category and creator relations.
 * Only returns events that are active AND have a visible status.
 *
 * @param {number} eventId
 * @returns {Promise<object|null>} Event with relations, or null if not found/filtered out.
 */
export async function findByIdWithRelations(eventId) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      isActive: true,
      status: {
        in: ["PUBLISHED", "IN_PROGRESS", "COMPLETED"],
      },
    },
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
          categoryType: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export default { findByIdWithRelations };
