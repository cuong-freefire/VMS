/**
 * Event Service - Business logic for Event Management module
 * Owner: Member 5 - DucNM (UC15, UC16, UC67, UC69, UC70)
 *
 * Responsibilities:
 * - Get paginated list of events with role-based visibility and status filter
 * - UC15: Create event
 * - UC16: Edit event
 * - UC67: View Pending Events — Manager/Admin xem sự kiện PENDING_APPROVAL
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

import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import eventRepository from '../repositories/event.repository.js';
import { ServiceError } from '../utils/response.util.js';

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
            type: event.category.categoryType.toLowerCase()
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
 * @throws {ServiceError} 403 nếu user không có quyền xem pending events
 */

async function getEvents(query, currentUser) {
    // 1. Parse pagination
    const { skip, take, page, limit } = parsePagination(query);

    // 2. Determine role
    let roleName = null;
    if (currentUser?.role_id) {
        roleName = await eventRepository.findRoleNameById(currentUser.role_id);
    }
    const normalizedRole = roleName?.toUpperCase();

    // 3. Build where clause
    const where = buildWhereClause(normalizedRole, query, currentUser);

    // 4. Query database
    const [events, total] = await Promise.all([
        eventRepository.findEvents({ skip, take, where }),
        eventRepository.countEvents(where)
    ]);

    // 5. Format response
    const formattedEvents = events.map(formatEvent);

    return {
        events: formattedEvents,
        pagination: createPaginationMeta(total, page, limit)
    };
}

/**
 * Validate event ID and ensure event exists.
 *
 * @param {number} eventId
 * @returns {Promise<Object>}
 * @throws {ServiceError}
 */
async function validateEventExists(eventId) {
    // Validate event ID
    if (!Number.isInteger(eventId) || eventId <= 0) {
        throw new ServiceError(
            'Mã sự kiện không hợp lệ.',
            400,
            'INVALID_EVENT_ID'
        );
    }

    const event = await eventRepository.findById(eventId);

    // Check event exists
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
 * Validate pending event before approval.
 *
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event record
 * @throws {ServiceError} 400 nếu ID không hợp lệ
 * @throws {ServiceError} 404 nếu event không tồn tại
 * @throws {ServiceError} 409 nếu event không ở trạng thái PENDING_APPROVAL
 */
async function validatePendingEvent(eventId) {
    // Validate event ID and ensure event exists
    const event = await validateEventExists(eventId);

    // Check event is pending approval
    if (event.status !== 'PENDING_APPROVAL') {
        throw new ServiceError(
            'Sự kiện không ở trạng thái chờ duyệt.',
            409,
            'INVALID_STATUS'
        );
    }

    return event;
}

/**
 * Approve a pending event.
 * UC69: Manager/Admin phê duyệt sự kiện PENDING_APPROVAL.
 *
 * Business Logic:
 * 1. Validate pending event
 * 2. Update event: status = PUBLISHED, approvedBy = currentUser.id, approvedAt = now
 * 3. Return formatted response
 *
 * @param {number} eventId - Event ID từ route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted event object
 * @throws {ServiceError} 400/404/409 errors
 */
async function approveEvent(eventId, currentUser) {
    // 1. Validate event can be approved
    await validatePendingEvent(eventId);

    // 2. Update event: status = PUBLISHED, approvedBy, approvedAt
    const updatedEvent = await eventRepository.updateEventStatus(eventId, {
        status: 'PUBLISHED',
        approvedBy: currentUser.user_id,
        approvedAt: new Date()
    });

    // 3. Return formatted response
    return formatApprovedEvent(updatedEvent);
}

/**
 * Reject a pending event.
 * UC70: Reject Event — Manager/Admin từ chối sự kiện PENDING_APPROVAL
 *
 * Business Logic:
 * 1. Validate pending event
 * 2. Get rejection reason
 * 3. Update event
 * 4. Return formatted response
 *
 * @param {number} eventId - Event ID từ route param
 * @param {Object} data - Request body: { rejection_reason }
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted event object
 * @throws {ServiceError} 400/404/409 errors
 */
async function rejectEvent(eventId, data, currentUser) {
    // 1. Validate pending event
    await validatePendingEvent(eventId);

    // 2. Get rejection_reason
    const reason = data.rejection_reason.trim();

    // 3. Update event: status = REJECTED, rejectedReason, rejectedBy, rejectedAt
    const updatedEvent = await eventRepository.updateEventStatus(eventId, {
        status: 'REJECTED',
        rejectedReason: reason,
        rejectedBy: currentUser.user_id,
        rejectedAt: new Date()
    });

    // 4. Return formatted response
    return formatRejectedEvent(updatedEvent);
}

/**
 * Create a new event.
 * UC15: Add Event — Staff tạo sự kiện mới.
 *
 * Business Logic:
 * 1. Validate category exists and is active
 * 2. Extract createdBy from JWT (req.user.user_id)
 * 3. Convert validated date strings to Date objects
 * 4. Create event with status DRAFT
 * 5. Return formatted response
 *
 * @param {Object} data - Event data from validated request body
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted created event object
 * @throws {ServiceError} 400 if category not found
 */
async function createEvent(data, currentUser) {
    const { categoryId } = data;

    // 1. Validate category exists and is active
    const category = await eventRepository.findCategoryById(categoryId);
    if (!category || !category.isActive) {
        throw new ServiceError(
            'Danh mục sự kiện không tồn tại.',
            400,
            'CATEGORY_NOT_FOUND'
        );
    }

    // 2. Build create data with createdBy from JWT
    const createData = {
        title: data.title,
        description: data.description,
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
    // 1. Validate event ID and ensure event exists
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
    const deletedEvent = await eventRepository.softDelete(eventId);

    // 7. Return success response
    return formatDeletedEvent(deletedEvent);
}

export default {
    getEvents,
    approveEvent,
    rejectEvent,
    createEvent,
    updateEvent,
    deleteEvent
};
