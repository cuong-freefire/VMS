/**
 * Event Service - Business logic for Event Management module
 * Owner: Member 5 - DucNM (UC67)
 *
 * Responsibilities:
 * - Get paginated list of events with role-based visibility and status filter
 * - UC67: View Pending Events — Manager/Admin xem sự kiện PENDING_APPROVAL
 *
 * Rules:
 * - Guest (req.user = null) → chỉ thấy PUBLISHED events (no status param)
 * - Volunteer → chỉ thấy PUBLISHED events
 * - Staff → chỉ thấy PUBLISHED events (hoặc events do Staff tạo)
 * - Manager/Admin → thấy tất cả events (không status) hoặc lọc theo status
 * - Manager/Admin mới có quyền xem PENDING_APPROVAL events
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
 * Map status string từ query sang Prisma EventStatus enum.
 */
const EVENT_STATUS_MAP = {
    draft: 'DRAFT',
    published: 'PUBLISHED',
    rejected: 'REJECTED',
    in_progress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED'
};

/**
 * Build Prisma where clause từ role visibility
 * và query params.
 *
 * @param {string|null} normalizedRole - Current user's role
 * @param {Object} query - Query params
 * @returns {Object} Prisma where clause
 * @throws {ServiceError} 403 nếu user không có quyền xem pending events
 */
function buildWhereClause(normalizedRole, query) {
    const conditions = [];

    conditions.push({
        isActive: true
    });

    const requestedStatus = query.status?.toLowerCase();

    if (requestedStatus === 'pending_approval') {
        if (
            normalizedRole !== 'MANAGER' &&
            normalizedRole !== 'ADMIN'
        ) {
            throw new ServiceError(
                'Bạn không có quyền truy cập tài nguyên này',
                403,
                'FORBIDDEN'
            );
        }

        conditions.push({
            status: 'PENDING_APPROVAL'
        });
    } else if (requestedStatus) {
        const mappedStatus = EVENT_STATUS_MAP[requestedStatus];

        if (mappedStatus) {
            conditions.push({
                status: mappedStatus
            });
        }
    } else {
        if (
            normalizedRole !== 'MANAGER' &&
            normalizedRole !== 'ADMIN'
        ) {
            conditions.push({
                status: 'PUBLISHED'
            });
        }
    }

    return conditions.length
        ? { AND: conditions }
        : {};
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
    const where = buildWhereClause(normalizedRole, query);

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

export default {
    getEvents
};