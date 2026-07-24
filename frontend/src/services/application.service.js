import axiosApi from "../api/axiosApi.js";

export const applicationService = {
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