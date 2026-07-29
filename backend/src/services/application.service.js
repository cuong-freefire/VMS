/**
 * Application Service — Business logic for volunteer applications.
 *
 * Includes submit flow and cancel flow.
 *
 * Owner: Member 1 - CuongLH
 * Features: UC10 — Submit Application, UC14 — Cancel Application
 */
import { PrismaClient } from "@prisma/client";
import AppError from "../utils/app-error.util.js";
import appRepo from "../repositories/application.repository.js";

const prisma = new PrismaClient();

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

export default { submitApplication, cancelUserApplication };
