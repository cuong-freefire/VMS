/**
 * Application Service - Business logic for Application Management module
 * Owner: Member 4 - DucNM (UC22, UC23)
 *
 * Responsibilities:
 * - UC22: Get paginated list of applications by event with status filter
 * - UC23: Get application detail
 * - Validate event ownership (Staff chỉ xem applications của event do mình tạo)
 * - Format response with volunteer info and pagination metadata
 *
 * Rules:
 * - Business logic MUST be in Service layer (not Controller or Repository)
 * - Ownership check: createdBy from JWT must match event's createdBy
 * - Uses pagination.util.js for consistent pagination
 */

import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import { ServiceError } from '../utils/response.util.js';
import applicationRepository from '../repositories/application.repository.js';
import eventRepository from '../repositories/event.repository.js';

function buildBaseApplication(app) {
    return {
        id: app.id,
        userId: app.userId,
        eventId: app.eventId,
        status: app.status,
        message: app.message,
        processedBy: app.processedBy,
        processedAt: app.processedAt?.toISOString() ?? null,
        createdAt: app.createdAt?.toISOString() ?? null,
        updatedAt: app.updatedAt?.toISOString() ?? null
    };
}

/**
 * Format application from Prisma format to API response format.
 *
 * @param {Object} app - Application from Prisma
 * @returns {Object} Formatted application
 */
function formatApplication(app) {
    return {
        ...buildBaseApplication(app),
        volunteer: app.submittedByUser
            ? {
                id: app.submittedByUser.id,
                fullName: app.submittedByUser.fullName,
                avatarUrl: app.submittedByUser.avatarUrl
            }
            : null
    };
}

/**
 * Get paginated list of applications for an event.
 * UC22: View Application List — Staff xem danh sách đơn đăng ký của sự kiện.
 *
 * Business Logic:
 * 1. Parse pagination params
 * 2. Validate event exists (404 if not)
 * 3. Validate ownership — Staff chỉ xem applications của event do mình tạo (403 if not)
 * 4. Query applications with optional status filter
 * 5. Format response with pagination metadata
 *
 * @param {number} eventId - Event ID from route param
 * @param {Object} query - Query params: { page, limit, status }
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} { applications, pagination }
 * @throws {ServiceError} 404 if event not found
 * @throws {ServiceError} 403 if not event owner
 */
async function getApplicationsByEvent(eventId, query, currentUser) {
    // 1. Parse pagination
    const { skip, take, page, limit } = parsePagination(query);

    // 2. Validate event exists
    const event = await eventRepository.findById(eventId);
    if (!event) {
        throw new ServiceError(
            'Event not found',
            404,
            'RESOURCE_NOT_FOUND'
        );
    }

    // 3. Validate ownership — only event creator can view applications
    if (event.createdBy !== currentUser.user_id) {
        throw new ServiceError(
            'Bạn không có quyền truy cập tài nguyên này',
            403,
            'FORBIDDEN'
        );
    }

    // 4. Get status filter from query (already validated by Zod)
    const status = query.status ?? null;

    // 5. Query applications
    const [applications, total] = await Promise.all([
        applicationRepository.findByEventId(eventId, { skip, take, status }),
        applicationRepository.countByEventId(eventId, status)
    ]);

    // 6. Format response
    const formattedApplications = applications.map(formatApplication);

    return {
        applications: formattedApplications,
        pagination: createPaginationMeta(total, page, limit)
    };
}

/**
 * Get application detail with full volunteer profile and event info.
 * UC23: View Application Detail — Staff xem chi tiết đơn đăng ký.
 *
 * Business Logic:
 * 1. Find application by ID (404 if not found)
 * 2. Validate ownership — only event creator can view detail (403 if not)
 * 3. Format response with volunteer profile, skills, event info
 *
 * @param {number} applicationId - Application ID from route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted application detail object
 * @throws {ServiceError} 404 if application not found
 * @throws {ServiceError} 403 if not event owner
 */
async function getApplicationDetail(applicationId, currentUser) {
    // 1. Find application by ID
    const application = await applicationRepository.findDetailById(applicationId);
    if (!application) {
        throw new ServiceError(
            'Application not found',
            404,
            'RESOURCE_NOT_FOUND'
        );
    }

    // 2. Validate ownership — only event creator can view
    if (application.event.createdBy !== currentUser.user_id) {
        throw new ServiceError(
            'Bạn không có quyền truy cập tài nguyên này',
            403,
            'FORBIDDEN'
        );
    }

    // 3. Format and return response
    return formatApplicationDetail(application);
}

/**
 * Format application detail from Prisma format to API response format.
 *
 * @param {Object} app - Application detail from Prisma
 * @returns {Object} Formatted application detail
 */
function formatApplicationDetail(app) {
    return {
        ...buildBaseApplication(app),
        volunteer: app.submittedByUser
            ? {
                id: app.submittedByUser.id,
                fullName: app.submittedByUser.fullName,
                email: app.submittedByUser.email,
                phone: app.submittedByUser.phone,
                avatarUrl: app.submittedByUser.avatarUrl,
                skills: (app.submittedByUser.userSkills ?? []).map((us) => ({
                    id: us.skill.id,
                    name: us.skill.name
                }))
            }
            : null,
        event: app.event
            ? {
                id: app.event.id,
                title: app.event.title,
                startDate: app.event.startDate?.toISOString() ?? null,
                endDate: app.event.endDate?.toISOString() ?? null
            }
            : null
    };
}

export default {
    getApplicationsByEvent,
    getApplicationDetail
};
