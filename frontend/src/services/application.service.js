import axiosApi from "../api/axiosApi.js";

export const applicationService = {
  /**
   * Gửi đơn đăng ký tham gia sự kiện.
   * UC10 — Submit Application
   * @param {number} eventId - ID của sự kiện
   * @param {string} [message] - Tin nhắn tùy chọn
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  async submitApplication(eventId, message) {
    return axiosApi.post("/api/v1/applications", { eventId, message });
  },

  /**
   * Hủy đơn đăng ký sự kiện.
   * UC14 — Cancel Application
   * @param {number} applicationId - ID của đơn đăng ký
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  async cancelApplication(applicationId) {
    return axiosApi.patch(`/api/v1/applications/${applicationId}/cancel`);
  },

  /* ── Staff/Manager/Admin: Application Management (UC22, UC23, UC24, UC25) ── */

  /**
   * Lấy danh sách đơn đăng ký của một sự kiện.
   * UC22 — View Application List (Staff, chủ sở hữu event).
   *
   * @param {number} eventId - Event ID (path param)
   * @param {Object} params - Query params
   * @param {string} [params.status] - pending | approved | rejected | cancelled
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ data: { applications: Array, pagination: Object } }>}
   */
  async getApplicationsByEvent(eventId, params = {}) {
    return axiosApi.get(`/api/v1/events/${eventId}/applications`, { params });
  },

  /**
   * Lấy chi tiết đơn đăng ký.
   * UC23 — View Application Detail (Staff, chủ sở hữu event).
   *
   * @param {number} applicationId - Application ID
   * @returns {Promise<{ data: Object }>}
   */
  async getApplicationDetail(applicationId) {
    return axiosApi.get(`/api/v1/applications/${applicationId}`);
  },

  /**
   * Phê duyệt đơn đăng ký.
   * UC24 — Approve Application (Staff, chủ sở hữu event) — không cần body.
   *
   * @param {number} applicationId - Application ID
   * @returns {Promise<{ data: Object }>}
   */
  async approveApplication(applicationId) {
    return axiosApi.patch(`/api/v1/applications/${applicationId}/approve`);
  },

  /**
   * Từ chối đơn đăng ký kèm lý do.
   * UC25 — Reject Application (Staff, chủ sở hữu event) — body { message }.
   *
   * @param {number} applicationId - Application ID
   * @param {Object} data - { message: string } (tối thiểu 10 ký tự)
   * @returns {Promise<{ data: Object }>}
   */
  async rejectApplication(applicationId, data) {
    return axiosApi.patch(`/api/v1/applications/${applicationId}/reject`, data);
  },
};
