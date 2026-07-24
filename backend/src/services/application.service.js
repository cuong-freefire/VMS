/**
 * Application Service — Business logic for volunteer applications.
 *
 * Includes cancel flow: validate ownership, event state, and
 * transition status from PENDING/APPROVED → CANCELLED.
 *
 * Owner: Member 1 - CuongLH
 */
import { PrismaClient } from "@prisma/client";
import AppError from "../utils/app-error.util.js";
import appRepo from "../repositories/application.repository.js";

const prisma = new PrismaClient();

/**
 * Cancel a user's own application.
 *
 * Domain rules (from AGENTS.md / ADR):
 * - Volunteer can ONLY cancel when event has NOT started
 *   (event is not InProgress and not Completed).
 * - Status transitions one-way: PENDING|APPROVED → CANCELLED.
 * - No-show must go through Attendance, NOT cancel.
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
    return appRepo.cancelApplication(tx, applicationId);
  });

  return cancelled;
}

export default { cancelUserApplication };