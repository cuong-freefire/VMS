/**
 * Authentication Repository - Database operations for auth module
 * Owner: Member 1 (CuongLH)
 * 
 * Responsibilities:
 * - CRUD operations for email_verifications
 * - User lookup and creation
 * - Role queries
 * 
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 * - Errors are thrown to Service layer
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find verification record by email and type
 * @param {string} email - User email (normalized)
 * @param {string} type - Verification type ('REGISTER' or 'RESET_PASSWORD')
 * @returns {Promise<Object|null>} EmailVerification record or null
 */
export const findVerificationByEmailAndType = async (email, type = 'REGISTER') => {
    return prisma.emailVerification.findUnique({
        where: {
            email_type: {
                email,
                type,
            },
        },
    });
};

/**
 * Find verification record by email (any type)
 * @param {string} email - User email
 * @returns {Promise<Object|null>} EmailVerification record or null
 */
export const findVerificationByEmail = async (email) => {
    return prisma.emailVerification.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Create new verification record
 * @param {string} email - User email
 * @param {string} otpHash - Bcrypt hash of OTP
 * @param {string} type - Verification type (default: 'REGISTER')
 * @returns {Promise<Object>} Created EmailVerification record
 */
export const createVerification = async (email, otpHash, type = 'REGISTER') => {
    return prisma.emailVerification.create({
        data: {
            email,
            otpHash,
            type,
            lastSentAt: new Date(),
            attempts: 0,
            isLocked: false,
        },
    });
};

/**
 * Update verification record (OTP hash, attempts, lockout)
 * @param {string} email - User email
 * @param {Object} updateData - Fields to update
 * @param {string} type - Verification type
 * @returns {Promise<Object>} Updated EmailVerification record
 */
export const updateVerification = async (email, updateData, type = 'REGISTER') => {
    return prisma.emailVerification.update({
        where: {
            email_type: {
                email,
                type,
            },
        },
        data: updateData,
    });
};

/**
 * Delete verification record
 * @param {string} email - User email
 * @param {string} type - Verification type
 * @returns {Promise<Object>} Deleted EmailVerification record
 */
export const deleteVerification = async (email, type = 'REGISTER') => {
    return prisma.emailVerification.delete({
        where: {
            email_type: {
                email,
                type,
            },
        },
    });
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User record or null
 */
export const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.passwordHash - Bcrypt hash of password
 * @param {string} userData.fullName - Full name
 * @param {string} userData.phone - Phone number
 * @param {number} userData.roleId - Role ID (Volunteer role)
 * @returns {Promise<Object>} Created User record
 */
export const createUser = async (userData) => {
    const {
        email,
        passwordHash,
        fullName,
        phone,
        roleId,
    } = userData;

    return prisma.user.create({
        data: {
            email,
            passwordHash,
            fullName,
            phone,
            roleId,
            isActive: true,
            emailVerified: true,
        },
    });
};

/**
 * Get Volunteer role
 * @returns {Promise<Object|null>} Role record or null
 */
export const getVolunteerRole = async () => {
    return prisma.role.findUnique({
        where: { name: 'VOLUNTEER' },
    });
};

export default {
    findVerificationByEmailAndType,
    findVerificationByEmail,
    createVerification,
    updateVerification,
    deleteVerification,
    findUserByEmail,
    createUser,
    getVolunteerRole,
};
