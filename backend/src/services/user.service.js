/**
 * User Service - Business logic for User Management module
 * Owner: Member 4 - DucNM (UC26)
 *
 * Responsibilities:
 * - Get paginated list of users with search, filter, sort
 * - Build Prisma where/orderBy clauses from query params
 *
 * Rules:
 * - Business logic MUST be in Service layer, NOT Controller
 * - Validation MUST be done before calling Repository
 * - Errors thrown as ServiceError for Controller to catch
 */

import { ServiceError } from '../utils/response.util.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import userRepository from '../repositories/user.repository.js';

/**
 * Get paginated list of users with search, filter and sort.
 * Chỉ Admin mới có quyền gọi (kiểm tra ở middleware).
 *
 * @param {Object} query - Query params từ request
 * @param {number} [query.page=1] - Số trang
 * @param {number} [query.limit=20] - Số items mỗi trang
 * @param {string} [query.search] - Tìm kiếm theo tên hoặc email
 * @param {string} [query.role] - Lọc theo role (volunteer, staff, manager, admin)
 * @param {string} [query.sort] - Sắp xếp (field:direction)
 * @returns {Promise<Object>} { users, pagination }
 * @throws {ServiceError} 400 nếu params không hợp lệ
 */
async function getUsers(query) {
    // 1. Parse pagination
    const { skip, take, page, limit } = parsePagination(query);

    // 2. Build where clause
    const where = buildWhereClause(query);

    // 3. Build orderBy clause
    const orderBy = buildOrderBy(query.sort);

    // 4. Query database
    const [users, total] = await Promise.all([
        userRepository.findMany({ skip, take, where, orderBy }),
        userRepository.count(where)
    ]);

    // 5. Format response
    const formattedUsers = users.map(formatUser);

    return {
        users: formattedUsers,
        pagination: createPaginationMeta(total, page, limit)
    };
}

/**
 * Build Prisma where clause từ query params.
 *
 * @param {Object} query - Query params
 * @returns {Object} Prisma where clause
 */
function buildWhereClause(query) {
    const conditions = [];

    // Search: tìm theo full_name hoặc email (case-insensitive)
    if (query.search) {
        const search = query.search.trim();
        conditions.push({
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        });
    }

    // Role filter: lọc theo role name
    if (query.role) {
        const roleName = query.role.toUpperCase();
        conditions.push({
            role: {
                name: roleName
            }
        });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Build Prisma orderBy clause từ sort param.
 * Default: created_at:desc
 *
 * @param {string} sort - Sort string (field:direction)
 * @returns {Array} Prisma orderBy array
 */
function buildOrderBy(sort) {
    const defaultSort = [{ createdAt: 'desc' }];

    if (!sort) {
        return defaultSort;
    }

    const match = sort.match(/^(\w+):(asc|desc)$/i);
    if (!match) {
        return defaultSort;
    }

    const field = match[1];
    const direction = match[2].toLowerCase();

    // Map query field names to Prisma field names
    const fieldMap = {
        'created_at': 'createdAt',
        'full_name': 'fullName',
        'email': 'email'
    };

    const prismaField = fieldMap[field];
    if (!prismaField) {
        return defaultSort;
    }

    return [{ [prismaField]: direction }];
}

/**
 * Format user object for API response.
 * Map Prisma field names to API contract field names.
 *
 * @param {Object} user - User from Prisma
 * @returns {Object} Formatted user
 */
function formatUser(user) {
    return {
        user_id: user.id,
        full_name: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatarUrl,
        role: user.role?.name || null,
        is_active: user.isActive,
        created_at: user.createdAt ? user.createdAt.toISOString() : null,
        updated_at: user.updatedAt ? user.updatedAt.toISOString() : null
    };
}

export default {
    getUsers
};