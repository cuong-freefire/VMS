import axiosApi from "../api/axiosApi.js";

export const userService = {
  /* ── Profile (self) ── */
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

  /* ── Admin: User Management (UC26–UC30) ── */
  async getUsers(params = {}) {
    return axiosApi.get('/api/v1/users', { params });
  },
  async getUserById(id) {
    return axiosApi.get(`/api/v1/users/${id}`);
  },
  async createUser(data) {
    return axiosApi.post('/api/v1/users', data);
  },
  async updateUser(id, data) {
    return axiosApi.patch(`/api/v1/users/${id}`, data);
  },
};