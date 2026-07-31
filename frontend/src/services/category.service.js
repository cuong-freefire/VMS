import axiosApi from "../api/axiosApi.js";

/**
 * Category Service — Frontend API client for Category Management
 *
 * Backend endpoints:
 * - GET /api/v1/categories (public list w/ pagination + search + type + sort)
 * - POST /api/v1/categories (Manager/Admin — add category)
 * - PATCH /api/v1/categories/:id (Manager/Admin — edit category)
 *
 * Response wrapper ({ success, message, data }) is handled by axiosApi interceptors.
 */

export const categoryService = {
    /**
     * Fetch all categories (event types) for filter dropdowns.
     * Guest-accessible — returns only active categories.
     *
     * @returns {Promise<{ data: { categories: Array } }>}
     */
    async fetchEventTypes() {
        return axiosApi.get("/api/v1/categories");
    },

    /* ── Admin/Manager: Category Management (UC31, UC-feat-search-category) ── */

    /**
     * Get paginated list of categories with search, type filter and sort.
     *
     * @param {Object} params - Query params
     * @param {number} [params.page=1]
     * @param {number} [params.limit=20]
     * @param {string} [params.search]
     * @param {string} [params.type] - location | event_type | time_frame
     * @param {string} [params.sort] - field:direction (created_at, updated_at, name)
     * @returns {Promise<{ data: { categories: Array, pagination: Object } }>}
     */
    async getCategories(params = {}) {
        return axiosApi.get("/api/v1/categories", { params });
    },

    /**
     * Create a new category.
     * UC32: Add Category — Manager/Admin tạo danh mục mới.
     *
     * @param {Object} data - { name, description, type }
     * @returns {Promise<{ data: Object }>}
     */
    async createCategory(data) {
        return axiosApi.post("/api/v1/categories", data);
    },

    /**
     * Update a category by ID.
     * UC33: Edit Category — Manager/Admin chỉnh sửa danh mục.
     *
     * @param {number} id - Category ID
     * @param {Object} data - { name?, description?, is_active? }
     * @returns {Promise<{ data: Object }>}
     */
    async updateCategory(id, data) {
        return axiosApi.patch(`/api/v1/categories/${id}`, data);
    },
};

export default categoryService;