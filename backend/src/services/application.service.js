/**
 * Application Service — Business logic for application endpoints.
 *
 * Includes submit flow, cancel flow (Volunteer-facing: UC10, UC14)
 * and list, detail, approve, reject flows (Staff-facing: UC22, UC23, UC24, UC25)
 *
 * Owner: Member 1 - CuongLH (UC10, UC14)
 * Owner: Member 4 - DucNM (UC22, UC23, UC24, UC25)
 */
import { PrismaClient } from "@prisma/client";
import AppError from "../utils/app-error.util.js";
import appRepo from "../repositories/application.repository.js";
import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import { ServiceError } from '../utils/response.util.js';
import eventRepository from '../repositories/event.repository.js';

const prisma = new PrismaClient();

// ─── UC10-UC14: Volunteer-facing application endpoints ───────────────

/**
 * Submit a new application for an event.
 *
 * Business rules (UC10 — AGENTS.md / DATABASE2.md):
 * - FR-001: Only VOLUNTEER role can apply (isActive enforced by auth middleware).
 * - FR-002: Event must be PUBLISHED and not started.
 * - FR-003: Event must not be full (current_participants < max_capacity).
 * - FR-004: One active application per event (terminal states CANCELLED & PAYMENT_EXPIRED allow re-apply).
 * - FR-005: Always start as PENDING (WAITING_PAYMENT is set after Staff/Manager approval).
 * - FR-006: Uses Prisma transaction for atomicity.
 *
 * @param {number}  userId - Authenticated user ID from JWT (req.user.user_id)
 * @param {string}  role - User role from JWT (req.user.role)
 * @param {number}  eventId
 * @param {string?} message - Optional message from volunteer
 * @returns {Promise<object>} Created application
 */
export async function submitApplication(userId, role, eventId, message) {
  // FR-001: Only VOLUNTEER role (isActive already enforced by authMiddleware)
  if (role !== "VOLUNTEER") {
    throw new AppError("Chỉ tình nguyện viên mới có thể đăng ký sự kiện.", 403, "FORBIDDEN");
  }

  return prisma.$transaction(async (tx) => {
    // FR-002: Validate event exists, is PUBLISHED, and not started
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        startDate: true,
        maxCapacity: true,
        approvedParticipants: true,
        isPaid: true,
      },
    });

    if (!event) {
      throw new AppError("Sự kiện không tồn tại.", 404, "NOT_FOUND");
    }

    if (event.status !== "PUBLISHED") {
      throw new AppError("Sự kiện chưa được công bố, không thể đăng ký.", 400, "BAD_REQUEST");
    }

    if (new Date(event.startDate) <= new Date()) {
      throw new AppError("Sự kiện đã bắt đầu, không thể đăng ký.", 400, "BAD_REQUEST");
    }

    // FR-003: Capacity check
    if (event.approvedParticipants >= event.maxCapacity) {
      throw new AppError("Sự kiện đã đủ số lượng người tham gia.", 409, "CONFLICT");
    }

    // FR-004: Duplicate check — one active application per event
    const existing = await appRepo.findActiveByUserAndEvent(tx, userId, eventId);
    if (existing) {
      throw new AppError(
        "Bạn đã có đơn đăng ký cho sự kiện này. Vui lòng kiểm tra trạng thái đơn.",
        409,
        "CONFLICT"
      );
    }

    // FR-005: Always start as PENDING — WAITING_PAYMENT is set after Staff/Manager approval
    const initialStatus = "PENDING";

    // FR-006: Create application within transaction
    const application = await appRepo.createApplication(tx, {
      userId,
      eventId,
      status: initialStatus,
      message,
    });

    return application;
  });
}

/**
 * Cancel a user's own application.
 *
 * Domain rules (from AGENTS.md / ADR):
 * - Volunteer can ONLY cancel when event has NOT started
 *   (event is not InProgress and not Completed).
 * - Status transitions one-way: PENDING|APPROVED|WAITING_PAYMENT|PAYMENT_EXPIRED → CANCELLED.
 * - No-show must go through Attendance, NOT cancel.
 * - WAITING_PAYMENT: cancel payment transaction as FAILED (if exists).
 * - APPROVED: decrement approved_participants on event.
 *
 * @param {number} applicationId
 * @param {number} userId - From JWT (must match application.userId)
 * @returns {Promise<object>} Cancelled application with event info
 */
export async function cancelUserApplication(applicationId, userId) {
  const app = await appRepo.findByIdWithEvent(applicationId);

  if (!app) {
    throw new AppError("Không tìm thấy đơn đăng ký.", 404, "NOT_FOUND");
  }

  if (app.userId !== userId) {
    throw new AppError("Bạn không có quyền hủy đơn này.", 403, "FORBIDDEN");
  }

  const terminalStatuses = ["CANCELLED", "REJECTED"];
  if (terminalStatuses.includes(app.status)) {
    const msg =
      app.status === "CANCELLED"
        ? "Đơn này đã được hủy trước đó."
        : "Đơn đăng ký này đã bị từ chối, không thể hủy.";
    throw new AppError(msg, 409, "CONFLICT");
  }

  const { event } = app;
  if (!event) {
    throw new AppError("Sự kiện không tồn tại.", 404, "NOT_FOUND");
  }

  // FR-005: Chỉ cho phép hủy khi sự kiện PUBLISHED và chưa bắt đầu
  if (event.status !== "PUBLISHED") {
    throw new AppError(
      "Sự kiện không còn khả dụng để hủy đơn đăng ký.",
      409,
      "CONFLICT"
    );
  }

  if (new Date(event.startDate) <= new Date()) {
    throw new AppError(
      "Sự kiện đã bắt đầu, không thể hủy đơn đăng ký.",
      409,
      "CONFLICT"
    );
  }

  // Use transaction for atomic cancel
  const cancelled = await prisma.$transaction(async (tx) => {
    // If WAITING_PAYMENT, cancel the payment transaction as FAILED
    if (app.status === "WAITING_PAYMENT") {
      const payment = await appRepo.findPaymentByApplicationId(tx, applicationId);
      if (payment && payment.status === "PENDING") {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }
    }

    // If APPROVED, decrement approved_participants
    if (app.status === "APPROVED") {
      await tx.event.update({
        where: { id: event.id },
        data: { approvedParticipants: { decrement: 1 } },
      });
    }

    return appRepo.cancelApplication(tx, applicationId);
  });

  return cancelled;
}

// ─── UC22-UC25: Staff-facing application endpoints ───────────────────

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
 * Validate that an application:
 * - exists
 * - belongs to the current event owner
 * - is still in PENDING status
 *
 * @param {number} applicationId
 * @param {Object} currentUser
 * @returns {Promise<Object>} Application with event information
 * @throws {ServiceError}
 */
async function validatePendingApplication(applicationId, currentUser) {
    const application = await appRepo.findById(applicationId);

    if (!application) {
        throw new ServiceError(
            'Application not found',
            404,
            'RESOURCE_NOT_FOUND'
        );
    }

    // 2. Validate ownership — only event creator can process the application
    if (application.event.createdBy !== currentUser.user_id) {
        throw new ServiceError(
            'Bạn không có quyền truy cập tài nguyên này',
            403,
            'FORBIDDEN'
        );
    }

    // 3. Validate application status — must be PENDING
    if (application.status !== 'PENDING') {
        throw new ServiceError(
            `Application in ${application.status} state cannot be processed`,
            409,
            'INVALID_STATUS'
        );
    }

    return application;
}

/**
 * Get paginated list of applications for an event.
 * UC22: View Application List — Staff xem danh sách đơn đăng ký của sự kiện.
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
        appRepo.findByEventId(eventId, { skip, take, status }),
        appRepo.countByEventId(eventId, status)
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
 * @param {number} applicationId - Application ID from route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Formatted application detail object
 * @throws {ServiceError} 404 if application not found
 * @throws {ServiceError} 403 if not event owner
 */
async function getApplicationDetail(applicationId, currentUser) {
    // 1. Find application by ID
    const application = await appRepo.findDetailById(applicationId);
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

/**
 * Approve a pending application.
 * UC24: Approve Application — Staff phê duyệt đơn đăng ký.
 *
 * @param {number} applicationId - Application ID from route param
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Updated application object
 * @throws {ServiceError} 404 if application not found
 * @throws {ServiceError} 403 if not event owner
 * @throws {ServiceError} 409 if status not PENDING or capacity full
 */
async function approveApplication(applicationId, currentUser) {
    // 1. Validate pending application
    const application = await validatePendingApplication(
        applicationId,
        currentUser
    );

    // 4. Check event capacity
    if (application.event.approvedParticipants >= application.event.maxCapacity) {
        throw new ServiceError(
            'Event is at full capacity. Cannot approve more applications.',
            409,
            'CAPACITY_EXCEEDED'
        );
    }

    // 5. Update application: status = APPROVED, processedBy, processedAt
    const updatedApp = await appRepo.updateApplicationStatus(applicationId, {
        status: 'APPROVED',
        processedBy: currentUser.user_id,
        processedAt: new Date()
    });

    // 6. Increment event.approvedParticipants
    await eventRepository.updateEvent(application.eventId, {
        approvedParticipants: application.event.approvedParticipants + 1
    });

    // 7. Return formatted response
    return buildBaseApplication(updatedApp);
}

/**
 * Reject a pending application.
 * UC25: Reject Application — Staff từ chối đơn đăng ký kèm lý do.
 *
 * @param {number} applicationId - Application ID from route param
 * @param {Object} data - Request body: { message: string }
 * @param {Object} currentUser - User from JWT (req.user)
 * @returns {Promise<Object>} Updated application object
 * @throws {ServiceError} 404 if application not found
 * @throws {ServiceError} 403 if not event owner
 * @throws {ServiceError} 409 if status not PENDING
 */
async function rejectApplication(applicationId, data, currentUser) {
    // 1. Validate pending application
    await validatePendingApplication(
        applicationId,
        currentUser
    );

    // 4. Update application: status = REJECTED, message, processedBy, processedAt
    const updatedApp = await appRepo.updateApplicationStatus(applicationId, {
        status: 'REJECTED',
        message: data.message,
        processedBy: currentUser.user_id,
        processedAt: new Date()
    });

    // 5. Return formatted response
    return buildBaseApplication(updatedApp);
}

export {
    submitApplication,
    cancelUserApplication,
    getApplicationsByEvent,
    getApplicationDetail,
    approveApplication,
    rejectApplication
};

export default {
    submitApplication,
    cancelUserApplication,
    getApplicationsByEvent,
    getApplicationDetail,
    approveApplication,
    rejectApplication
};