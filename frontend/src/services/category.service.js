import axiosApi from "../api/axiosApi.js";

/**
 * Category Service — Frontend API client for Category Management
 *
 * Backend endpoint: GET /api/v1/categories (public, no auth required)
 * Response: { success: boolean, data: { categories: Array<{ id, name, categoryType }> } }
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
};

export default categoryService;