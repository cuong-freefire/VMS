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

export default {
    getCategories
};