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

import bcrypt from 'bcryptjs';
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

const ROLE_PRIORITY = {
    VOLUNTEER: 1,
    STAFF: 2,
    MANAGER: 3,
    ADMIN: 4
};

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

/**
 * Get user detail by ID.
 * UC27: View User Detail — Admin xem chi tiết user.
 * Vẫn trả về user bị soft-delete (is_active = false).
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Formatted user object
 * @throws {ServiceError} 404 nếu user không tồn tại
 */
async function getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw new ServiceError(
            'User not found.',
            404,
            'USER_NOT_FOUND'
        );
    }

    return formatUser(user);
}

/**
 * Create a new user.
 * UC28: Add User — Admin tạo tài khoản mới.
 *
 * Business Logic:
 * 1. Check email uniqueness (kể cả inactive users) → 409 nếu đã tồn tại
 * 2. Validate role_id tồn tại → 400 nếu không hợp lệ
 * 3. Hash password với bcryptjs (12 rounds)
 * 4. Create user trong database
 * 5. Format response (không bao gồm password)
 *
 * @param {Object} data - User data từ request body
 * @returns {Promise<Object>} Formatted user object
 * @throws {ServiceError} 400/409 errors
 */
async function createUserService(data) {
    // 1. Check email uniqueness
    const email = data.email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw new ServiceError(
            'Email already exists.',
            409,
            'EMAIL_EXISTS'
        );
    }

    // 2. Validate role_id tồn tại
    const role = await userRepository.findRoleById(data.role_id);
    if (!role) {
        throw new ServiceError(
            'Invalid role.',
            400,
            'INVALID_ROLE'
        );
    }

    // 3. Hash password với bcryptjs (12 rounds)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 4. Create user trong database
    try {
        const newUser = await userRepository.createUser({
            email,
            passwordHash,
            fullName: data.full_name.trim(),
            phone: data.phone?.trim() || null,
            roleId: data.role_id
        });

        // 5. Format response (reuse formatUser)
        return formatUser(newUser);
    } catch (error) {
        if (error.code === "P2002") {
            throw new ServiceError(
                "Email already exists.",
                409,
                "EMAIL_EXISTS"
            );
        }

        throw error;
    }
}

/**
 * Update user information.
 * UC29: Edit User — Admin chỉnh sửa thông tin user.
 *
 * Business Logic:
 * 1. Check user exists → 404 nếu không tìm thấy
 * 2. Check self-role-downgrade → 403 nếu Admin tự hạ role
 * 3. Validate role_id tồn tại (nếu có)
 * 4. Map request fields to Prisma field names
 * 5. Update user trong database
 * 6. Format response (không bao gồm password)
 *
 * @param {number} userId - User ID từ route param
 * @param {Object} data - Fields to update từ request body
 * @param {number} currentUserId - Admin ID từ JWT (req.user.user_id)
 * @returns {Promise<Object>} Formatted user object
 * @throws {ServiceError} 400/403/404 errors
 */
async function updateUserService(userId, data, currentUserId) {
    // 1. Check user exists
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
        throw new ServiceError(
            'User not found.',
            404,
            'USER_NOT_FOUND'
        );
    }

    // 2. Validate role_id (nếu có) và lấy role mới
    if (data.role_id !== undefined) {
        const newRole = await userRepository.findRoleById(data.role_id);

        if (!newRole) {
            throw new ServiceError(
                'Invalid role.',
                400,
                'INVALID_ROLE'
            );
        }

        // 3. Admin không được tự hạ quyền của chính mình
        const currentRolePriority =
            ROLE_PRIORITY[existingUser.role.name.toUpperCase()];
        const newRolePriority =
            ROLE_PRIORITY[newRole.name.toUpperCase()];

        if (
            currentRolePriority === undefined ||
            newRolePriority === undefined
        ) {
            throw new ServiceError(
                'Unsupported role.',
                400,
                'INVALID_ROLE'
            );
        }

        if (
            userId === currentUserId &&
            newRolePriority < currentRolePriority
        ) {
            throw new ServiceError(
                'Cannot downgrade your own role.',
                403,
                'SELF_ROLE_DOWNGRADE'
            );
        }
    }

    // 4. Map request fields to Prisma field names
    const updateData = {};
    if (data.full_name !== undefined) {
        updateData.fullName = data.full_name.trim();
    }
    if (data.phone !== undefined) {
        updateData.phone = data.phone?.trim() || null;
    }
    if (data.avatar_url !== undefined) {
        updateData.avatarUrl = data.avatar_url;
    }
    if (data.role_id !== undefined) {
        updateData.roleId = data.role_id;
    }
    if (data.is_active !== undefined) {
        updateData.isActive = data.is_active;
    }

    // 5. Update user trong database
    const updatedUser = await userRepository.updateUser(userId, updateData);

    // 6. Format response
    return formatUser(updatedUser);
}

export default {
    getUsers,
    getUserById,
    createUserService,
    updateUserService
};
