/**
 * User Repository - Database operations for User Management module
 * Owner: Member 4 - DucNM (UC26)
 *
 * Responsibilities:
 * - Query users with pagination, search, filter, sort
 * - Count total users matching filter criteria
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
    if (!roleId) {
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

export default {
    findMany,
    count,
    findRoleNameById
};