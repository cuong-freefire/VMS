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

/**
 * Find all published events with pagination, filtering, and sorting.
 * Volunteer-facing: only returns events with status = PUBLISHED and isActive = true.
 *
 * @param {object} options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page
 * @param {string} [options.search] - Search keyword for title or location
 * @param {number} [options.category] - Filter by categoryId
 * @param {string} [options.sort] - Sort order: newest | oldest | upcoming
 * @param {boolean} [options.isPaid] - Filter by paid/free: true = paid, false = free
 * @param {boolean} [options.hasSlots] - Filter by availability: true = còn chỗ, false = hết chỗ
 * @returns {Promise<{ events: object[], total: number }>}
 */
export async function findAllWithFilters({ page, limit, search, category, sort, isPaid, hasSlots }) {
  const where = {
    isActive: true,
    status: "PUBLISHED",
  };

  // Search: match title OR location (case-insensitive)
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { location: { contains: search } },
    ];
  }

  // Category filter
  if (category) {
    where.categoryId = category;
  }

  // Paid/Free filter
  if (typeof isPaid === "boolean") {
    where.isPaid = isPaid;
  }

  // Sort order
  let orderBy;
  switch (sort) {
    case "oldest":
      orderBy = { startDate: "asc" };
      break;
    case "upcoming":
      // Upcoming: only future events, sorted by nearest first.
      where.startDate = { gte: new Date() };
      orderBy = { startDate: "asc" };
      break;
    case "newest":
    default:
      orderBy = { startDate: "desc" };
      break;
  }

  // Availability filter — field-to-field comparison requires raw query
  if (typeof hasSlots === "boolean") {
    if (hasSlots) {
      const eligibleIds = await prisma.$queryRaw`
        SELECT id FROM events
        WHERE is_active = true
          AND status = 'PUBLISHED'
          AND approved_participants < max_capacity
      `;
      where.id = { in: eligibleIds.map((e) => e.id) };
    } else {
      const eligibleIds = await prisma.$queryRaw`
        SELECT id FROM events
        WHERE is_active = true
          AND status = 'PUBLISHED'
          AND approved_participants >= max_capacity
      `;
      where.id = { in: eligibleIds.map((e) => e.id) };
    }
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
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
        isPaid: true,
        price: true,
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
      orderBy,
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
}

export default { findByIdWithRelations, findAllWithFilters };