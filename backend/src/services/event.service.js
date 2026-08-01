/**
 * Event Service - Business logic for Event Management module
 * Owner: Member 5 - DucNM (UC15, UC16, UC67, UC68, UC69, UC70)
 * Owner: Member 1 (CuongLH) — UC08, UC09 (Volunteer-facing event endpoints)
 *
 * Responsibilities:
 * - UC08: List published events (public, volunteer-facing)
 * - UC09: View event detail (public, volunteer-facing)
 * - UC15: Create event
 * - UC16: Edit event
 * - UC67: View Pending Events — Manager/Admin xem sự kiện PENDING_APPROVAL
 * - UC68: Get event detail (role-based)
 * - UC69: Approve Event — Manager/Admin phê duyệt sự kiện PENDING_APPROVAL
 * - UC70: Reject event — Manager/Admin từ chối sự kiện PENDING_APPROVAL
 *
 * Rules:
 * - Guest (req.user = null) → chỉ thấy PUBLISHED events (no status param)
 * - Volunteer → chỉ thấy PUBLISHED events
 * - Staff → thấy các sự kiện do mình tạo hoặc các sự kiện đã PUBLISHED
 * - Manager/Admin → thấy tất cả events (không status) hoặc lọc theo status
 * - Manager/Admin mới có quyền xem PENDING_APPROVAL events
 * - Manager/Admin mới có quyền approve event
 * - Manager/Admin mới có quyền reject event
 */

import eventRepository from "../repositories/event.repository.js";
import applicationRepository from "../repositories/application.repository.js";
import logger from "../config/logger.config.js";
import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import { ServiceError } from '../utils/response.util.js';

// ─── UC08-UC09: Volunteer-facing event endpoints ─────────────────────

/**
 * Get event detail by ID.
 * Handles both Guest (userId = null) and logged-in Volunteer.
 * UC09: Volunteer-facing event detail.
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
 * UC08: Volunteer-facing event list.
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

// ─── UC15-UC17, UC67-UC70: Management event endpoints ────────────────

/**
 * Format event from Prisma format to API response format.
 *
 * @param {Object} event - Event from Prisma
 * @returns {Object} Formatted event
 */
function formatEvent(event) {
    return {
        event_id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        start_date: event.startDate ? event.startDate.toISOString() : null,
        end_date: event.endDate ? event.endDate.toISOString() : null,
        application_deadline: event.applicationDeadline ? event.applicationDeadline.toISOString() : null,
        max_capacity: event.maxCapacity,
        approved_participants: event.approvedParticipants,
        image_url: event.imageUrl,
        status: event.status.toLowerCase(),
        is_active: event.isActive,
        created_at: event.createdAt ? event.createdAt.toISOString() : null,
        updated_at: event.updatedAt ? event.updatedAt.toISOString() : null,
        category: event.category ? {
            id: event.category.id,
            name: event.category.name,
            type: CATEGORY_TYPE_TO_API[event.category.categoryType] || null
        } : null,
        created_by: event.createdByUser ? {
            id: event.createdByUser.id,
            full_name: event.createdByUser.fullName,
            email: event.createdByUser.email
        } : null
    };
}

/**
 * Format approved event for API response.
 *
 * @param {Object} event - Updated event from Prisma
 * @returns {Object} Formatted response
 */
function formatApprovedEvent(event) {
    return {
        event_id: event.id,
        title: event.title,
        status: event.status.toLowerCase(),
        approved_by: event.approvedBy,
        approved_at: event.approvedAt
            ? event.approvedAt.toISOString()
            : null,
        created_at: event.createdAt
            ? event.createdAt.toISOString()
            : null,
        updated_at: event.updatedAt
            ? event.updatedAt.toISOString()
            : null
    };
}

/**
 * Format rejected event for API response.
 *
 * @param {Object} event
 * @returns {Object}
 */
function formatRejectedEvent(event) {
    return {
        event_id: event.id,
        title: event.title,
        status: event.status.toLowerCase(),
        rejected_by: event.rejectedBy,
        rejected_at: event.rejectedAt
            ? event.rejectedAt.toISOString()
            : null,
        rejection_reason: event.rejectedReason,
        created_at: event.createdAt
            ? event.createdAt.toISOString()
            : null,
        updated_at: event.updatedAt
            ? event.updatedAt.toISOString()
            : null
    };
}

/**
 * Format deleted event for API response.
 *
 * @param {Object} event
 * @returns {Object}
 */
function formatDeletedEvent(event) {
    return {
        event_id: event.id,
        title: event.title,
        status: event.status.toLowerCase(),
        is_active: event.isActive,
        updated_at: event.updatedAt?.toISOString() ?? null
    };
}

/**
 * Map status string từ query sang Prisma EventStatus enum.
 */
const EVENT_STATUS_MAP = {
    draft: 'DRAFT',
    pending_approval: 'PENDING_APPROVAL',
    published: 'PUBLISHED',
    rejected: 'REJECTED',
    in_progress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED'
};

/**
 * Map Prisma EventCategoryType enum sang API contract type string.
 * "LOCATION" → "location", "TYPE" → "event_type", "TIME" → "time_frame"
 */
const CATEGORY_TYPE_TO_API = {
    'LOCATION': 'location',
    'TYPE': 'event_type',
    'TIME': 'time_frame'
};

/**
 * Non-editable statuses for UC16.
 * IN_PROGRESS, COMPLETED, CANCELLED cannot be edited.
 */
const NON_EDITABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

/**
 * Critical fields that trigger status reset to PENDING_APPROVAL
 * when changed on a PUBLISHED event.
 */
const CRITICAL_FIELDS = ['title', 'location', 'startDate', 'endDate', 'categoryId'];

/**
 * Build Prisma where clause từ role visibility
 * và query params.
 *
 * @param {string|null} normalizedRole - Current user's role
 * @param {Object} query - Query params
 * @returns {Object} Prisma where clause
 * @throws {ServiceError} 400 nếu status không hợp lệ, 403 nếu user không có quyền xem pending events
 */
function buildWhereClause(normalizedRole, query, currentUser) {
    const conditions = [];

    conditions.push({
        isActive: true
    });

    // Search: tìm theo title hoặc location (case-insensitive)
    if (query.search) {
        const keyword = query.search.trim();

        conditions.push({
            OR: [
                {
                    title: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    location: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                }
            ]
        });
    }

    const requestedStatus = query.status?.toLowerCase();

    // Manager/Admin mới được xem danh sách pending approval
    if (requestedStatus === 'pending_approval') {
        if (
            normalizedRole !== 'MANAGER' &&
            normalizedRole !== 'ADMIN'
        ) {
            throw new ServiceError(
                'Bạn không có quyền thực hiện thao tác này.',
                403,
                'FORBIDDEN'
            );
        }

        conditions.push({
            status: 'PENDING_APPROVAL'
        });
    } else if (requestedStatus) {
        // Validator đã đảm bảo status hợp lệ
        const mappedStatus = EVENT_STATUS_MAP[requestedStatus];

        if (normalizedRole === 'STAFF') {
            if (mappedStatus === 'PUBLISHED') {
                conditions.push({
                    status: 'PUBLISHED'
                });
            } else {
                conditions.push({
                    status: mappedStatus,
                    createdBy: currentUser.user_id
                });
            }
        } else {
            conditions.push({
                status: mappedStatus
            });
        }

    } else {
        // Không truyền status
        if (normalizedRole === 'STAFF') {
            conditions.push({
                OR: [
                    {
                        status: 'PUBLISHED'
                    },
                    {
                        createdBy: currentUser.user_id
                    }
                ]
            });
        } else if (
            normalizedRole !== 'MANAGER' &&
            normalizedRole !== 'ADMIN'
        ) {
            // Guest + Volunteer chỉ xem được PUBLISHED
            conditions.push({
                status: 'PUBLISHED'
            });
        }
    }

    return {
        AND: conditions
    };
}

/**
 * Build Prisma orderBy clause từ sort param.
 * Default: created_at:desc
 *
 * @param {string} sort - Sort string (field:direction)
 * @returns {Object} Prisma orderBy object
 */
function buildOrderBy(sort) {
    const defaultSort = { createdAt: 'desc' };

    if (!sort) {
        return defaultSort;
    }

    const match = sort.match(/^(\w+):(asc|desc)$/i);
    if (!match) {
        return defaultSort;
    }

    const field = match[1];
    const direction = match[2].toLowerCase();

    // Map query field names to Prisma field names
    const fieldMap = {
        'created_at': 'createdAt',
        'start_date': 'startDate'
    };

    const prismaField = fieldMap[field];
    if (!prismaField) {
        return defaultSort;
    }

    return { [prismaField]: direction };
}

/**
 * Get paginated list of events with role-based visibility and status filter.
 * UC67: Manager/Admin có thể xem sự kiện PENDING_APPROVAL.
 *
 * Business Logic:
 * 1. Parse pagination params
 * 2. Determine role from JWT
 * 3. Build where clause theo role và status filter
 * 4. Query database
 * 5. Format response
 *
 * @param {Object} query - Query params: { page, limit, status }
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @returns {Promise<Object>} { events, pagination }
 */
async function getEvents(query, currentUser) {
    // 1. Parse pagination params
    const { page, limit, skip } = parsePagination(query);

    // 2. Determine role from JWT
    let roleName = null;
    if (currentUser?.role_id) {
        roleName = await eventRepository.findRoleNameById(currentUser.role_id);
    }
    const normalizedRole = roleName?.toUpperCase();

    // 3. Build where clause
    const where = buildWhereClause(normalizedRole, query, currentUser);

    // 4. Build orderBy
    const orderBy = buildOrderBy(query.sort);

    // 5. Query database
    const [events, total] = await Promise.all([
        eventRepository.findMany({ skip, take: limit, where, orderBy }),
        eventRepository.count({ where })
    ]);

    // 6. Format response
    const formattedEvents = events.map(formatEvent);

    return {
        events: formattedEvents,
        pagination: createPaginationMeta(total, page, limit)
    };
}

/**
 * Validate event exists by ID.
 *
 * @param {number} eventId
 * @returns {Promise<Object>} Event object
 * @throws {ServiceError} 404 if not found
 */
async function validateEventExists(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
        throw new ServiceError(
            'Sự kiện không tồn tại.',
            404,
            'EVENT_NOT_FOUND'
        );
    }
    return event;
}

/**
 * Approve a PENDING_APPROVAL event.
 * UC69: Manager/Admin phê duyệt sự kiện.
 *
 * Business Logic:
 * 1. Validate event exists (404 if not)
 * 2. Validate status is PENDING_APPROVAL (409 if not)
 * 3. Update event status to PUBLISHED
 * 4. Return formatted response
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted approved event object
 * @throws {ServiceError} 404 if event not found
 * @throws {ServiceError} 409 if event not in PENDING_APPROVAL status
 */
async function approveEvent(eventId, currentUser) {
    // 1. Validate event exists
    const event = await validateEventExists(eventId);

    // 2. Validate status is PENDING_APPROVAL
    if (event.status !== 'PENDING_APPROVAL') {
        throw new ServiceError(
            'Chỉ có thể phê duyệt sự kiện ở trạng thái chờ phê duyệt.',
            409,
            'INVALID_STATUS'
        );
    }

    // 3. Update event status to PUBLISHED
    const updatedEvent = await eventRepository.updateEventStatus(eventId, {
        status: 'PUBLISHED',
        approvedBy: currentUser.user_id,
        approvedAt: new Date()
    });

    // 4. Return formatted response
    return formatApprovedEvent(updatedEvent);
}

/**
 * Reject a PENDING_APPROVAL event.
 * UC70: Manager/Admin từ chối sự kiện kèm lý do.
 *
 * Business Logic:
 * 1. Validate event exists (404 if not)
 * 2. Validate status is PENDING_APPROVAL (409 if not)
 * 3. Validate rejection reason (400 if empty)
 * 4. Update event status to REJECTED
 * 5. Return formatted response
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object} body - Request body containing rejection reason
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted rejected event object
 * @throws {ServiceError} 404 if event not found
 * @throws {ServiceError} 409 if event not in PENDING_APPROVAL status
 * @throws {ServiceError} 400 if rejection reason is empty
 */
async function rejectEvent(eventId, body, currentUser) {
    // 1. Validate event exists
    const event = await validateEventExists(eventId);

    // 2. Validate status is PENDING_APPROVAL
    if (event.status !== 'PENDING_APPROVAL') {
        throw new ServiceError(
            'Chỉ có thể từ chối sự kiện ở trạng thái chờ phê duyệt.',
            409,
            'INVALID_STATUS'
        );
    }

    // 3. Validate rejection reason
    if (!body.rejection_reason || !body.rejection_reason.trim()) {
        throw new ServiceError(
            'Vui lòng cung cấp lý do từ chối sự kiện.',
            400,
            'REJECTION_REASON_REQUIRED'
        );
    }

    // 4. Update event status to REJECTED
    const updatedEvent = await eventRepository.updateEventStatus(eventId, {
        status: 'REJECTED',
        rejectedBy: currentUser.user_id,
        rejectedAt: new Date(),
        rejectedReason: body.rejection_reason.trim()
    });

    // 5. Return formatted response
    return formatRejectedEvent(updatedEvent);
}

/**
 * Create a new event.
 * UC15: Staff tạo sự kiện mới.
 *
 * Business Logic:
 * 1. Validate category exists
 * 2. Build create data
 * 3. Create event via repository
 * 4. Return formatted response
 *
 * @param {Object} data - Validated event data from request body
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted created event object
 * @throws {ServiceError} 400 if category not found
 */
async function createEvent(data, currentUser) {
    // 1. Validate category exists
    if (data.categoryId) {
        const category = await eventRepository.findCategoryById(data.categoryId);
        if (!category || !category.isActive) {
            throw new ServiceError(
                'Danh mục sự kiện không tồn tại.',
                400,
                'CATEGORY_NOT_FOUND'
            );
        }
    }

    // 2. Build create data
    const createData = {
        title: data.title,
        description: data.description || '',
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        applicationDeadline: new Date(data.applicationDeadline),
        maxCapacity: data.maxCapacity,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl || null,
        createdBy: currentUser.user_id,
        status: 'DRAFT'
    };

    // 3. Create event via repository
    const event = await eventRepository.createEvent(createData);

    // 4. Format and return response
    return formatEvent(event);
}

/**
 * Update an existing event.
 * UC16: Edit Event — Staff cập nhật thông tin sự kiện.
 *
 * Business Logic:
 * 1. Validate event exists (404 if not)
 * 2. Validate ownership — only creator (createdBy) can edit (403 if not)
 * 3. Validate status — IN_PROGRESS/COMPLETED/CANCELLED cannot be edited (409)
 * 4. Validate category if categoryId provided
 * 5. Validate maxCapacity >= approvedParticipants if maxCapacity provided
 * 6. If PUBLISHED and critical fields changed → reset status to PENDING_APPROVAL
 * 7. Update event via repository
 * 8. Return formatted response
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object} data - Validated update data from request body
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted updated event object
 * @throws {ServiceError} 404 if event not found
 * @throws {ServiceError} 403 if not event owner
 * @throws {ServiceError} 409 if status not editable or capacity invalid
 */
async function updateEvent(eventId, data, currentUser) {
    // 1. Validate event exists
    const event = await validateEventExists(eventId);

    // 2. Validate ownership — only creator can edit
    if (event.createdBy !== currentUser.user_id) {
        throw new ServiceError(
            'Bạn không có quyền thực hiện thao tác này.',
            403,
            'FORBIDDEN'
        );
    }

    // 3. Validate status — non-editable statuses
    if (NON_EDITABLE_STATUSES.includes(event.status)) {
        throw new ServiceError(
            'Không thể chỉnh sửa sự kiện ở trạng thái: ' + event.status.toLowerCase(),
            409,
            'INVALID_STATUS'
        );
    }

    // 4. Validate category if categoryId provided
    if (data.categoryId !== undefined) {
        const category = await eventRepository.findCategoryById(data.categoryId);
        if (!category || !category.isActive) {
            throw new ServiceError(
                'Danh mục sự kiện không tồn tại.',
                400,
                'CATEGORY_NOT_FOUND'
            );
        }
    }

    // 5. Validate maxCapacity >= approvedParticipants
    if (data.maxCapacity !== undefined && data.maxCapacity < event.approvedParticipants) {
        throw new ServiceError(
            'Sức chứa không được nhỏ hơn số lượng tình nguyện viên đã được duyệt.',
            409,
            'INVALID_CAPACITY'
        );
    }

    // 6. Build update data
    const updateData = {};
    const editableFields = ['title', 'description', 'location', 'startDate', 'endDate', 'applicationDeadline', 'maxCapacity', 'categoryId', 'imageUrl'];

    for (const field of editableFields) {
        if (data[field] !== undefined) {
            if (field === 'startDate' || field === 'endDate' || field === 'applicationDeadline') {
                updateData[field] = new Date(data[field]);
            } else if (field === 'description') {
                updateData[field] = data[field] ?? '';
            } else {
                updateData[field] = data[field];
            }
        }
    }

    // 7. If PUBLISHED and critical fields changed → reset status to PENDING_APPROVAL
    if (event.status === 'PUBLISHED') {
        const hasCriticalChanges = CRITICAL_FIELDS.some(field => data[field] !== undefined);
        if (hasCriticalChanges) {
            updateData.status = 'PENDING_APPROVAL';
        }
    }

    // 8. Update event via repository
    const updatedEvent = await eventRepository.updateEvent(eventId, updateData);

    // 9. Return formatted response
    return formatEvent(updatedEvent);
}

/**
 * Non-deletable statuses for UC17.
 * IN_PROGRESS, COMPLETED cannot be deleted.
 */
const NON_DELETABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

/**
 * Delete (soft delete) an event.
 * UC17: Delete Event — Staff xóa sự kiện (soft delete via isActive = false).
 *
 * Business Logic:
 * 1. Validate event exists (404 if not)
 * 2. Validate event is active (not already soft-deleted)
 * 3. Validate ownership — only creator (createdBy) can delete (403 if not)
 * 4. Validate status — IN_PROGRESS/COMPLETED cannot be deleted (409)
 * 5. Validate no applications exist (409 if any)
 * 6. Soft delete event via repository (isActive = false)
 * 7. Return success response
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} { id, title, status, isActive, updatedAt }
 * @throws {ServiceError} 404 if event not found or already deleted
 * @throws {ServiceError} 403 if not event owner
 * @throws {ServiceError} 409 if status not deletable or has applications
 */
async function deleteEvent(eventId, currentUser) {
    // 1. Validate event ID and ensure event exists
    const event = await validateEventExists(eventId);

    // 2. Validate event is not already soft-deleted
    if (!event.isActive) {
        throw new ServiceError(
            'Sự kiện không tồn tại.',
            404,
            'EVENT_NOT_FOUND'
        );
    }

    // 3. Validate ownership — only creator can delete
    if (event.createdBy !== currentUser.user_id) {
        throw new ServiceError(
            'Bạn không có quyền truy cập tài nguyên này',
            403,
            'FORBIDDEN'
        );
    }

    // 4. Validate status — non-deletable statuses
    if (NON_DELETABLE_STATUSES.includes(event.status)) {
        throw new ServiceError(
            'Không thể xóa sự kiện ở trạng thái: ' + event.status.toLowerCase(),
            409,
            'INVALID_STATUS'
        );
    }

    // 5. Validate no applications exist
    const appCount = await eventRepository.countApplications(eventId);
    if (appCount > 0) {
        throw new ServiceError(
            'Sự kiện đã có đơn đăng ký nên không thể xóa.',
            409,
            'EVENT_HAS_APPLICATIONS'
        );
    }

    // 6. Soft delete event via repository
    const deletedEvent = await eventRepository.softDeleteEvent(eventId);

    // 7. Return success response
    return formatDeletedEvent(deletedEvent);
}

/**
 * Get event detail by ID (Management).
 * UC68: Manager/Admin có thể xem chi tiết sự kiện PENDING.
 *
 * Business Logic:
 * 1. Validate event exists (400/404 if invalid or not found)
 * 2. Role-based check for PENDING events
 * - Guest → 401
 * - Staff/Volunteer → 403
 * - Manager/Admin → allow
 * 3. Return formatted event
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @returns {Promise<Object>} Formatted event object
 * @throws {ServiceError} 400 if invalid ID
 * @throws {ServiceError} 404 if event not found
 * @throws {ServiceError} 401 if Guest tries to view PENDING
 * @throws {ServiceError} 403 if Staff/Volunteer tries to view PENDING
 */
async function getEventById(eventId, currentUser) {
    // 1. Validate event exists
    const event = await validateEventExists(eventId);

    if (event.status === 'PENDING_APPROVAL') {

        if (!currentUser) {
            throw new ServiceError(
                'Vui lòng đăng nhập.',
                401,
                'UNAUTHORIZED'
            );
        }

        let roleName = null;

        if (currentUser?.role_id) {
            roleName = await eventRepository.findRoleNameById(currentUser.role_id);
        }

        const normalizedRole = roleName?.toUpperCase();

        if (
            normalizedRole !== 'MANAGER' &&
            normalizedRole !== 'ADMIN'
        ) {
            throw new ServiceError(
                'Bạn không có quyền truy cập tài nguyên này.',
                403,
                'FORBIDDEN'
            );
        }
    }
    // 3. Return formatted event
    return formatEvent(event);
}

export {
    getEvents,
    approveEvent,
    rejectEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById
};

export default {
    getEventDetail,
    listEvents,
    getEvents,
    approveEvent,
    rejectEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById
};