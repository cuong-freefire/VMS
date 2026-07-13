/**
 * Category Service - Business logic for Category Management module
 * Owner: Member 4 - DucNM (UC31)
 *
 * Responsibilities:
 * - Get list of categories with role-based visibility
 *
 * Rules:
 * - Guest (req.user = null) → chỉ thấy active categories
 * - Volunteer → chỉ thấy active categories
 * - Staff → chỉ thấy active categories
 * - Manager/Admin → thấy tất cả (active + inactive)
 */

import { ServiceError } from '../utils/response.util.js';
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
        type: cat.categoryType ? cat.categoryType.toLowerCase() : null,
        is_active: cat.isActive
    };
}

/**
 * Get categories based on user role.
 * Manager/Admin → thấy tất cả (active + inactive)
 * Staff/Volunteer/Guest → chỉ thấy active
 *
 * @param {Object|null} currentUser - User from JWT (req.user) or null for Guest
 * @returns {Promise<Object>} { categories: Array }
 */
async function getCategories(currentUser) {
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

    const where = showAll ? {} : { isActive: true };

    const categories = await categoryRepository.findAll(where);

    return {
        categories: categories.map(formatCategory)
    };
}

/**
 * Map type string từ request body sang Prisma EventCategoryType enum.
 * "location" → "LOCATION", "event_type" → "TYPE", "time_frame" → "TIME"
 */
const typeMap = {
    'location': 'LOCATION',
    'event_type': 'TYPE',
    'time_frame': 'TIME'
};

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
    const categoryType = typeMap[data.type];
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
