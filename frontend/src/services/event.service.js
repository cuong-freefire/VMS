import axiosApi from "../api/axiosApi.js";

export const eventService = {
    /* ── Volunteer-facing (UC08, UC09) ── */
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

    /* ── Staff/Manager/Admin: Event Management (UC15, UC16, UC17, UC67, UC68) ── */

    /**
     * Lấy danh sách sự kiện quản lý với role-based visibility và status filter.
     * UC67: Staff/Manager/Admin.
     *
     * @param {Object} params - Query params
     * @param {number} [params.page=1]
     * @param {number} [params.limit=20]
     * @param {string} [params.status] - draft | pending_approval | published | rejected | in_progress | completed | cancelled
     * @param {string} [params.search] - Tìm theo title hoặc location
     * @param {string} [params.sort] - created_at:asc|desc, start_date:asc|desc
     * @returns {Promise<{ data: { events: Array, pagination: Object } }>}
     */
    async getManageEvents(params = {}) {
        return axiosApi.get("/api/v1/events/manage", { params });
    },

    /**
     * Lấy chi tiết sự kiện quản lý.
     * UC68: Staff/Manager/Admin — có thể xem cả PENDING_APPROVAL.
     *
     * @param {number} id - Event ID
     * @returns {Promise<{ data: Object }>}
     */
    async getManageEventById(id) {
        return axiosApi.get(`/api/v1/events/manage/${id}`);
    },

    /**
     * Tạo sự kiện mới.
     * UC15: Staff.
     *
     * @param {Object} data - { title, description?, location, startDate, endDate, applicationDeadline, maxCapacity, categoryId, imageUrl? }
     * @returns {Promise<{ data: Object }>}
     */
    async createEvent(data) {
        return axiosApi.post("/api/v1/events", data);
    },

    /**
     * Cập nhật sự kiện.
     * UC16: Staff (chủ sở hữu).
     *
     * @param {number} id - Event ID
     * @param {Object} data - Partial update fields
     * @returns {Promise<{ data: Object }>}
     */
    async updateEvent(id, data) {
        return axiosApi.patch(`/api/v1/events/${id}`, data);
    },

    /**
     * Xóa (soft delete) sự kiện.
     * UC17: Staff (chủ sở hữu).
     *
     * @param {number} id - Event ID
     * @returns {Promise<{ data: Object }>}
     */
    async deleteEvent(id) {
        return axiosApi.delete(`/api/v1/events/${id}`);
    },
};