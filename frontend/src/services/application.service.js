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
};
