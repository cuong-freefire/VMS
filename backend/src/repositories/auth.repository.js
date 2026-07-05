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
const findVerificationByEmailAndType = async (email, type = 'REGISTER') => {
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
const findVerificationByEmail = async (email) => {
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
const createVerification = async (email, otpHash, type = 'REGISTER') => {
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
const updateVerification = async (email, updateData, type = 'REGISTER') => {
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
const deleteVerification = async (email, type = 'REGISTER') => {
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
 * Find user by email with role
 * @param {string} email - User email (normalized)
 * @returns {Promise<Object|null>} User record with role or null
 */
const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });
};

/**
 * Get login attempts record by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} LoginAttempt record or null
 */
const getLoginAttempts = async (email) => {
    return prisma.loginAttempt.findUnique({
        where: { email }
    });
};

/**
 * Increment login attempts
 * @param {string} email - User email
 * @returns {Promise<Object>} Updated LoginAttempt record
 */
const incrementLoginAttempts = async (email) => {
    const existing = await prisma.loginAttempt.findUnique({
        where: { email }
    });

    if (existing) {
        const newAttempts = existing.attempts + 1;
        const updateData = { attempts: newAttempts };

        // Lock account if 5+ attempts
        if (newAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        return prisma.loginAttempt.update({
            where: { email },
            data: updateData
        });
    } else {
        return prisma.loginAttempt.create({
            data: {
                email,
                attempts: 1
            }
        });
    }
};

/**
 * Reset login attempts
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
const resetLoginAttempts = async (email) => {
    await prisma.loginAttempt.delete({
        where: { email }
    }).catch(() => {
        // Ignore if record doesn't exist
    });
};

/**
 * Upsert user session (Single Active Session)
 * @param {number} userId - User ID
 * @param {string} jti - JWT ID (unique per token)
 * @param {Date} expiresAt - Session expiry time
 * @returns {Promise<Object>} Created or updated UserSession
 */
const upsertSession = async (userId, jti, expiresAt) => {
    return prisma.userSession.upsert({
        where: { userId },
        create: {
            userId,
            jti,
            expiresAt
        },
        update: {
            jti,
            expiresAt,
            createdAt: new Date()
        }
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
const createUser = async (userData) => {
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
const getVolunteerRole = async () => {
    return prisma.role.findUnique({
        where: { name: 'VOLUNTEER' },
    });
};

const getJtiByUserId = async (userId) => {
    const response = await prisma.userSession.findUnique({
        where: { userId },
        select: {
            jti: true
        }
    })
    return response.jti || null;
}

export default {
    findVerificationByEmailAndType,
    findVerificationByEmail,
    createVerification,
    updateVerification,
    deleteVerification,
    findUserByEmail,
    createUser,
    getJtiByUserId,
    getVolunteerRole,
    getLoginAttempts,
    incrementLoginAttempts,
    resetLoginAttempts,
    upsertSession
};
