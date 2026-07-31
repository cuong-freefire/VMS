/**
 * Category Service - Business logic for Category Management module
 * Owner: Member 4 - DucNM (UC31, UC32, UC33, UC-feat-search-category)
 *
 * Responsibilities:
 * - Get list of categories with role-based visibility
 * - Search categories by name and description (UC-feat-search-category)
 * - Filter categories by type
 *
 * Rules:
 * - Guest (req.user = null) → chỉ thấy active categories
 * - Volunteer → chỉ thấy active categories
 * - Staff → chỉ thấy active categories
 * - Manager/Admin → thấy tất cả (active + inactive)
 */

import { ServiceError } from '../utils/response.util.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.util.js';
import categoryRepository from '../repositories/category.repository.js';

/**
 * Format category from Prisma format to API response format.
 *
 * @param {Object} cat - Category from Prisma
 * @returns {Object} Formatted category
 */
function formatCategory(cat) {
    return {
        category_id: cat.id,
        name: cat.name,
        description: cat.description,
        type: cat.categoryType ? CATEGORY_TYPE_TO_API[cat.categoryType] || null : null,
        is_active: cat.isActive,
        created_at: cat.createdAt ? cat.createdAt.toISOString() : null,
        updated_at: cat.updatedAt ? cat.updatedAt.toISOString() : null
    };
}

/**
 * Map type string từ request body sang Prisma EventCategoryType enum.
 * "location" → "LOCATION", "event_type" → "TYPE", "time_frame" → "TIME"
 */
const CATEGORY_TYPE_MAP = {
    'location': 'LOCATION',
    'event_type': 'TYPE',
    'time_frame': 'TIME'
};

/**
 * Map Prisma EventCategoryType enum sang API contract type string.
 * "LOCATION" → "location", "TYPE" → "event_type", "TIME" → "time_frame"
 */
const CATEGORY_TYPE_TO_API = {
    'LOCATION': 'location',
    'TYPE': 'event_type',
    'TIME': 'time_frame'
};

/**
 * Build Prisma where clause từ role visibility
 * và query params.
 *
 * @param {boolean} showAll
 * @param {Object} query
 * @returns {Object}
 */
function buildWhereClause(showAll, query) {
    const conditions = [];

    // Role visibility
    if (!showAll) {
        conditions.push({
            isActive: true
        });
    }

    // Search
    if (query.search) {
        const keyword = query.search.trim();

        conditions.push({
            OR: [
                {
                    name: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: keyword,
                        mode: 'insensitive'
                    }
                }
            ]
        });
    }

    // Type filter
    if (query.type) {
        const categoryType =
            CATEGORY_TYPE_MAP[query.type.toLowerCase()];

        if (categoryType) {
            conditions.push({
                categoryType
            });
        }
    }

    return conditions.length
        ? { AND: conditions }
        : {};
}

/**
 * Get paginated list of categories based on user role.
 * UC31: View Category List — page, limit, search, type, sort.
 * UC-feat-search-category: thêm search và type filter support.
 *
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @param {Object} [query={}] - Query params: { page, limit, search, type, sort }
 * @returns {Promise<Object>} { categories, pagination }
 */
async function getCategories(currentUser, query = {}) {
    let roleName = null;

    if (currentUser?.role_id) {
        roleName = await categoryRepository.findRoleNameById(
            currentUser.role_id
        );
    }

    const normalizedRole = roleName?.toUpperCase();

    const showAll =
        normalizedRole === "MANAGER" ||
        normalizedRole === "ADMIN";

    // 1. Parse pagination
    const { skip, take, page, limit } = parsePagination(query);

    // 2. Build where clause (role visibility + search + type)
    const where = buildWhereClause(showAll, query);

    // 3. Build orderBy clause
    const orderBy = buildOrderBy(query.sort);

    // 4. Query database
    const [categories, total] = await Promise.all([
        categoryRepository.findMany({ skip, take, where, orderBy }),
        categoryRepository.count(where)
    ]);

    // 5. Format response
    const formattedCategories = categories.map(formatCategory);

    return {
        categories: formattedCategories,
        pagination: createPaginationMeta(total, page, limit)
    };
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
        'updated_at': 'updatedAt',
        'name': 'name'
    };

    const prismaField = fieldMap[field];
    if (!prismaField) {
        return defaultSort;
    }

    return [{ [prismaField]: direction }];
}

/**
 * Create a new category.
 * UC32: Add Category — Manager/Admin thêm danh mục mới.
 *
 * Business Logic:
 * 1. Normalize input
 * 2. Map type string sang Prisma enum
 * 3. Check uniqueness: cùng name trong cùng type → 409 nếu trùng
 * 4. Create category trong database
 * 5. Format response
 *
 * @param {Object} data - Category data từ request body
 * @returns {Promise<Object>} Formatted category object
 * @throws {ServiceError} 409 nếu tên đã tồn tại trong cùng type
 */
async function createCategoryService(data) {
    // Chuẩn hóa dữ liệu
    const name = data.name.trim();

    // Map type string sang Prisma enum
    const categoryType = CATEGORY_TYPE_MAP[data.type];
    if (!categoryType) {
        throw new ServiceError(
            'Invalid category type.',
            400,
            'INVALID_CATEGORY_TYPE'
        );
    }

    // Check uniqueness: cùng name trong cùng type
    const existing = await categoryRepository.findByNameAndType(name, categoryType);
    if (existing) {
        throw new ServiceError(
            'Category name already exists in this type.',
            409,
            'CATEGORY_EXISTS'
        );
    }

    // Create category trong database
    try {
        const newCategory = await categoryRepository.createCategory({
            name,
            categoryType,
            description: data.description
        });

        // Format response
        return formatCategory(newCategory);
    } catch (error) {
        if (error.code === 'P2002') {
            throw new ServiceError(
                'Category name already exists in this type.',
                409,
                'CATEGORY_EXISTS'
            );
        }

        throw error;
    }
}

/**
 * Update category information.
 * UC33: Edit Category — Manager/Admin chỉnh sửa danh mục.
 *
 * Business Logic:
 * 1. Check category exists → 404 nếu không tìm thấy
 * 2. If name changed, check uniqueness trong cùng type (exclude self) → 409 nếu trùng
 * 3. Map request fields to Prisma field names
 * 4. Update category trong database
 * 5. Format response
 *
 * @param {number} categoryId - Category ID từ route param
 * @param {Object} data - Fields to update từ request body
 * @returns {Promise<Object>} Formatted category object
 * @throws {ServiceError} 400/404/409 errors
 */
async function updateCategoryService(categoryId, data) {

    // Validate category ID
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new ServiceError(
            'Invalid category id.',
            400,
            'INVALID_CATEGORY_ID'
        );
    }

    // 1. Check category exists
    const existing = await categoryRepository.findById(categoryId);
    if (!existing) {
        throw new ServiceError(
            'Category not found.',
            404,
            'CATEGORY_NOT_FOUND'
        );
    }

    const normalizedName = data.name !== undefined
        ? data.name.trim()
        : undefined;

    // 2. If name changed, check uniqueness trong cùng type (exclude self)
    if (normalizedName !== undefined && normalizedName !== existing.name) {
        const conflict = await categoryRepository.findByNameAndType(
            normalizedName,
            existing.categoryType,
            categoryId // exclude self
        );
        if (conflict) {
            throw new ServiceError(
                'Category name already exists in this type.',
                409,
                'CATEGORY_EXISTS'
            );
        }
    }

    // 3. Map request fields to Prisma field names
    const updateData = {};
    if (normalizedName !== undefined) {
        updateData.name = normalizedName;
    }
    if (data.description !== undefined) {
        updateData.description = data.description ?? null;
    }
    if (data.is_active !== undefined) {
        updateData.isActive = data.is_active;
    }

    // 4. Update category trong database
    try {
        const updatedCategory = await categoryRepository.updateCategory(categoryId, updateData);

        // 5. Format response
        return formatCategory(updatedCategory);
    } catch (error) {
        if (error.code === 'P2002') {
            throw new ServiceError(
                'Category name already exists in this type.',
                409,
                'CATEGORY_EXISTS'
            );
        }

        throw error;
    }
}

export default {
    getCategories,
    createCategoryService,
    updateCategoryService
};