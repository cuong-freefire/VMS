import axiosApi from "../api/axiosApi.js";

export const userService = {
  async getMe() {
    return axiosApi.get('/api/v1/user/me', {
      headers: { 'Cache-Control': 'no-cache' }
    });
  },
  async updateProfile(data) {
    return axiosApi.patch('/api/v1/user/me', data);
  },
  async updateProfileWithAvatar(formData) {
    return axiosApi.patch('/api/v1/user/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async getVolunteerHistory(params = {}) {
    return axiosApi.get('/api/v1/user/me/history', { params });
  },
};
