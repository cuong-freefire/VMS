/**
 * User Repository - Database operations for User Management module
 * Owner: Member 4 - DucNM (UC26, UC27, UC28, UC29, UC30)
 *
 * Responsibilities:
 * - Query users with pagination, search, filter, sort
 * - Count total users matching filter criteria
 * - Find user by ID with role information
 * - Find role name by role ID
 * 
 * Rules:
 * - All database access goes through Prisma ORM
 * - No business logic, only data layer operations
 * - Errors are thrown to Service layer
 */

import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

/**
 * Find users with pagination, search, filter and sort.
 *
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip (pagination)
 * @param {number} options.take - Number of records to take (pagination)
 * @param {Object} options.where - Prisma where clause for filtering
 * @param {Object} options.orderBy - Prisma orderBy clause for sorting
 * @returns {Promise<Array>} List of users with role info
 */
const findMany = async ({ skip, take, where, orderBy }) => {
    // Query users cùng thông tin role để tránh N+1 query
    return prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    });
};

/**
 * Find role name by role id
 *
 * @param {number} roleId
 * @returns {Promise<string|null>}
 */
const findRoleNameById = async (roleId) => {
    // JWT không chứa role_id hoặc dữ liệu không hợp lệ
    if (roleId == null) {
        return null;
    }
    
    // Chỉ lấy tên role phục vụ middleware phân quyền
    const role = await prisma.role.findUnique({
        where: {
            id: roleId
        },
        select: {
            name: true
        }
    });

    // Trả về null nếu role không tồn tại
    return role?.name ?? null;
};

/**
 * Count total users matching filter criteria.
 *
 * @param {Object} where - Prisma where clause for filtering
 * @returns {Promise<number>} Total count of matching users
 */
const count = async (where) => {
    // Đếm tổng số user để tính pagination metadata
    return prisma.user.count({ where });
};

/**
 * Find a single user by ID with role info.
 * UC27: View User Detail — lookup user for detail page.
 * Không filter is_active — Admin cần thấy cả inactive users.
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User record with role or null
 */
const findById = async (userId) => {
    // Trả về cả user đang inactive theo yêu cầu UC27
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            roleId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

/**
 * Find a user by email.
 * UC28: Add User — check email uniqueness (kể cả inactive users).
 *
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User record or null
 */
const findByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email }
    });
};

/**
 * Find a role by ID.
 * UC28: Add User — validate role_id tồn tại.
 *
 * @param {number} roleId - Role ID
 * @returns {Promise<Object|null>} Role record or null
 */
const findRoleById = async (roleId) => {
    return prisma.role.findUnique({
        where: { id: roleId }
    });
};

/**
 * Create a new user.
 * UC28: Add User — tạo user mới, trả về thông tin không bao gồm password.
 *
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.passwordHash - Bcrypt hash of password
 * @param {string} data.fullName - Full name
 * @param {string} [data.phone] - Phone number
 * @param {number} data.roleId - Role ID
 * @returns {Promise<Object>} Created user with role info (no password)
 */
const createUser = async (data) => {
    return prisma.user.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash,
            fullName: data.fullName,
            phone: data.phone || null,
            roleId: data.roleId,
            isActive: true,
            emailVerified: true
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    });
};

/**
 * Update a user by ID.
 * UC29: Edit User — update thông tin user.
 * Trả về user đã cập nhật (không bao gồm password).
 *
 * @param {number} userId - User ID
 * @param {Object} data - Fields to update
 * @param {string} [data.fullName] - Full name
 * @param {string} [data.phone] - Phone number
 * @param {string} [data.avatarUrl] - Avatar URL
 * @param {number} [data.roleId] - Role ID
 * @param {boolean} [data.isActive] - Active status
 * @returns {Promise<Object>} Updated user with role info (no password)
 */
const updateUser = async (userId, data) => {
    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    });
};

export default {
    findMany,
    count,
    findRoleNameById,
    findById,
    findByEmail,
    findRoleById,
    createUser,
    updateUser
};
