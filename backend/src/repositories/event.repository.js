/**
 * Event Repository - Database operations for Event Management module
 * Owner: Member 1 (CuongLH) — UC08, UC09 (Volunteer-facing event queries)
 * Owner: Member 5 - DucNM (UC15, UC16, UC17, UC67, UC69, UC70)
 *
 * Responsibilities:
 * - UC08: Find all published events with filters (volunteer-facing)
 * - UC09: Find event by ID with relations (volunteer-facing)
 * - UC15: Create event
 * - UC16: Update event
 * - UC17: Soft delete event, count applications
 * - UC67: Find events with pagination and where filter (management)
 * - UC68: Find event by ID (management)
 * - UC69: Update event status (approve)
 * - UC70: Update event status (reject)
 *
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── UC08-UC09: Volunteer-facing event queries ───────────────────────

/**
 * Find an event by ID with category and creator relations.
 * Only returns events that are active AND have a visible status.
 * UC09: Volunteer-facing event detail.
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
 * UC08: Volunteer-facing event list.
 *
 * @param {object} options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page
 * @param {string} [options.search] - Search keyword for title or location
 * @param {number} [options.category] - Filter by categoryId
 * @param {string} [options.sort] - Sort order: newest | oldest | upcoming
 * @param {boolean} [options.isPaid] - Filter by paid/free
 * @param {boolean} [options.hasSlots] - Filter by availability
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

// ─── UC15-UC17, UC67-UC70: Management event queries ─────────────────

/**
 * Find events with pagination and optional where filter.
 * Includes category and creator information.
 * UC67: Management event list.
 *
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {Object} [options.where={}] - Prisma where clause for filtering
 * @returns {Promise<Array>} List of events with category and creator information
 */
const findMany = async ({ skip, take, where = {} }) => {
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
const count = async (where = {}) => {
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
 * Find event by ID (management).
 * - UC16: Edit Event — validate event exists and ownership.
 * - UC68: Get event detail (management)
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

export {
    findByIdWithRelations,
    findAllWithFilters,
    findMany,
    count,
    findRoleNameById,
    findById,
    updateEventStatus,
    createEvent,
    findCategoryById,
    updateEvent,
    softDeleteEvent,
    countApplications
};

export default {
    findByIdWithRelations,
    findAllWithFilters,
    findMany,
    count,
    findRoleNameById,
    findById,
    updateEventStatus,
    createEvent,
    findCategoryById,
    updateEvent,
    softDeleteEvent,
    countApplications
};