import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Find an application by userId and eventId.
 * Only returns active applications (status != CANCELLED).
 *
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<object|null>} Application record, or null.
 */
export async function findByUserAndEvent(userId, eventId) {
  return prisma.application.findFirst({
    where: {
      userId,
      eventId,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });
}

/**
 * Find an active application by userId and eventId.
 * "Active" means status is NOT in terminal states that allow re-apply:
 *   - CANCELLED (user tự hủy → được apply lại)
 *   - PAYMENT_EXPIRED (hết hạn thanh toán → được apply lại)
 * Terminal states that BLOCK re-apply: REJECTED.
 *
 * @param {object} tx - Prisma transaction client (or prisma for standalone)
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<object|null>} Active application, or null.
 */
export async function findActiveByUserAndEvent(tx, userId, eventId) {
  return tx.application.findFirst({
    where: {
      userId,
      eventId,
      status: { notIn: ["CANCELLED", "PAYMENT_EXPIRED"] },
    },
    select: {
      id: true,
      status: true,
    },
  });
}

/**
 * Create a new application. Must be called inside a Prisma transaction.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.eventId
 * @param {string}  params.status - Initial status (always PENDING for new applications)
 * @param {string?} params.message - Optional message from volunteer
 * @returns {Promise<object>} Created application
 */
export async function createApplication(tx, { userId, eventId, status, message }) {
  return tx.application.create({
    data: {
      userId,
      eventId,
      status,
      message: message || null,
    },
    select: {
      id: true,
      userId: true,
      eventId: true,
      status: true,
      message: true,
      createdAt: true,
    },
  });
}

/**
 * Find application by ID with related event data.
 * Used by cancel flow to validate event state (not InProgress/Completed).
 *
 * @param {number} applicationId
 * @returns {Promise<object|null>} Application with event, or null.
 */
export async function findByIdWithEvent(applicationId) {
  return prisma.application.findFirst({
    where: { id: applicationId, status: { not: "CANCELLED" } },
    include: {
      event: {
        select: { id: true, status: true, startDate: true },
      },
    },
  });
}

/**
 * Cancel (set status = CANCELLED) an application.
 * Must be called inside a Prisma transaction.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {number} applicationId
 * @returns {Promise<object>} Updated application
 */
export async function cancelApplication(tx, applicationId) {
  return tx.application.update({
    where: { id: applicationId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Find a payment transaction by application ID.
 *
 * @param {import("@prisma/client").PrismaClient} tx - Transaction client
 * @param {number} applicationId
 * @returns {Promise<object|null>} PaymentTransaction, or null.
 */
export async function findPaymentByApplicationId(tx, applicationId) {
  return tx.paymentTransaction.findFirst({
    where: { applicationId },
    select: { id: true, status: true, vnpTxnRef: true },
  });
}

export default {
  findByUserAndEvent,
  findActiveByUserAndEvent,
  createApplication,
  findByIdWithEvent,
  cancelApplication,
  findPaymentByApplicationId,
};
