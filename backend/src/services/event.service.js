import eventRepository from "../repositories/event.repository.js";
import applicationRepository from "../repositories/application.repository.js";
import logger from "../config/logger.config.js";

/**
 * Get event detail by ID.
 * Handles both Guest (userId = null) and logged-in Volunteer.
 *
 * Business rules:
 * - Only PUBLIC events: status IN [PUBLISHED, IN_PROGRESS, COMPLETED], isActive = true
 * - Guest: userApplication = null
 * - Volunteer: userApplication = { id, status, createdAt } or null
 * - Computed fields: remainingSlots, isFull
 *
 * @param {number} eventId
 * @param {number|null} userId
 * @returns {Promise<object>} EventDetailDTO
 * @throws {AppError} 404 if event not found
 */
export async function getEventDetail(eventId, userId) {
  // 1. Fetch event with relations
  const event = await eventRepository.findByIdWithRelations(eventId);

  if (!event) {
    throw Object.assign(new Error("Không tìm thấy sự kiện."), {
      status: 404,
      code: "NOT_FOUND",
    });
  }

  // 2. Compute derived fields
  const remainingSlots = Math.max(0, event.maxCapacity - event.approvedParticipants);
  const isFull = event.approvedParticipants >= event.maxCapacity;

  // 3. Determine user application (null for Guest by default)
  let userApplication = null;

  // 4. If user is logged in, check for their application
  if (userId) {
    try {
      const application = await applicationRepository.findByUserAndEvent(
        userId,
        eventId
      );

      if (application) {
        userApplication = {
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
        };
      }
    } catch (err) {
      logger.error(
        { userId, eventId, error: err.message },
        "Failed to query user application"
      );
      // Not fatal — continue with userApplication = null
    }
  }

  // 5. Build and return DTO
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    applicationDeadline: event.applicationDeadline,
    maxCapacity: event.maxCapacity,
    approvedParticipants: event.approvedParticipants,
    remainingSlots,
    isFull,
    imageUrl: event.imageUrl,
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    category: event.category
      ? {
          id: event.category.id,
          name: event.category.name,
          categoryType: event.category.categoryType,
        }
      : null,
    createdBy: event.createdByUser
      ? {
          id: event.createdByUser.id,
          fullName: event.createdByUser.fullName,
          avatarUrl: event.createdByUser.avatarUrl,
        }
      : null,
    userApplication,
  };
}

/**
 * List published events with pagination, filtering, and sorting.
 * Public endpoint — no authentication required.
 *
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} [options.search]
 * @param {number} [options.category]
 * @param {string} [options.sort]
 * @param {boolean} [options.isPaid]
 * @param {boolean} [options.hasSlots]
 * @returns {Promise<{ events: object[], pagination: object }>}
 */
export async function listEvents({ page, limit, search, category, sort, isPaid, hasSlots }) {
  const { events, total } = await eventRepository.findAllWithFilters({
    page,
    limit,
    search,
    category,
    sort,
    isPaid,
    hasSlots,
  });

  // Compute derived fields for each event
  const mappedEvents = events.map((event) => {
    const remainingSlots = Math.max(0, event.maxCapacity - event.approvedParticipants);
    const isFull = event.approvedParticipants >= event.maxCapacity;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      applicationDeadline: event.applicationDeadline,
      maxCapacity: event.maxCapacity,
      approvedParticipants: event.approvedParticipants,
      remainingSlots,
      isFull,
      imageUrl: event.imageUrl,
      status: event.status,
      isPaid: event.isPaid,
      price: event.price,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            categoryType: event.category.categoryType,
          }
        : null,
      createdBy: event.createdByUser
        ? {
            id: event.createdByUser.id,
            fullName: event.createdByUser.fullName,
            avatarUrl: event.createdByUser.avatarUrl,
          }
        : null,
    };
  });

  const totalPages = Math.ceil(total / limit);

  return {
    events: mappedEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export default { getEventDetail, listEvents };