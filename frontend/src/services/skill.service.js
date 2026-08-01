import axiosApi from "../api/axiosApi.js";

/**
 * Skill Service — Frontend API client for Skill Management
 *
 * Backend endpoints:
 * - GET /api/v1/skills (public list w/ search + role-based visibility)
 * - POST /api/v1/skills (Manager/Admin — add skill)
 * - PATCH /api/v1/skills/:id (Manager/Admin — edit skill)
 *
 * Response wrapper ({ success, message, data }) is handled by axiosApi interceptors.
 */

export const skillService = {
    /**
     * Get list of skills with optional search.
     * UC34: View Skill List, UC-feat-search-skill.
     *
     * @param {Object} params - Query params
     * @param {string} [params.search] - Search by name or description
     * @returns {Promise<{ data: { skills: Array } }>}
     */
    async getSkills(params = {}) {
        return axiosApi.get("/api/v1/skills", { params });
    },

    /**
     * Create a new skill.
     * UC35: Add Skill — Manager/Admin tạo kỹ năng mới.
     *
     * @param {Object} data - { name, description? }
     * @returns {Promise<{ data: Object }>}
     */
    async createSkill(data) {
        return axiosApi.post("/api/v1/skills", data);
    },

    /**
     * Update a skill by ID.
     * UC36: Edit Skill — Manager/Admin chỉnh sửa kỹ năng.
     *
     * @param {number} id - Skill ID
     * @param {Object} data - { name?, description?, is_active? }
     * @returns {Promise<{ data: Object }>}
     */
    async updateSkill(id, data) {
        return axiosApi.patch(`/api/v1/skills/${id}`, data);
    },
};

export default skillService;