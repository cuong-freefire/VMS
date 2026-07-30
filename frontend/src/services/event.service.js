import axiosApi from "../api/axiosApi.js";

export const eventService = {
    async getEventDetail(id) {
        return axiosApi.get(`/api/v1/events/${id}`);
    },

    /**
     * Lấy danh sách sự kiện với phân trang, tìm kiếm và lọc.
     * @param {Object} params - Query parameters
     * @param {number} [params.page=1]
     * @param {number} [params.limit=12]
     * @param {string} [params.search]
     * @param {string} [params.category]
     * @param {string} [params.sort]
     * @returns {Promise<{ success: boolean, data: { events: Array, pagination: Object } }>}
     */
    async listEvents(params = {}) {
        return axiosApi.get("/api/v1/events", { params });
    },
};
