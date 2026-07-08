import axiosApi from "../api/axiosApi";

export const authService = {
  async login(data) {
    return axiosApi.post('/api/v1/auth/login', data);
  },
  async registerSendOtp(email) {
    return axiosApi.post('/api/v1/auth/register/send-otp', { email });
  },
  async registerVerifyOtp(data) {
    return axiosApi.post('/api/v1/auth/register/verify-otp', data);
  },
  async logout() {
    return axiosApi.post('/api/v1/auth/logout');
  },
  async forgotPasswordRequest(email) {
    return axiosApi.post('/api/v1/auth/forgot-password/request', { email });
  },
  async forgotPasswordVerifyOtp(data) {
    return axiosApi.post('/api/v1/auth/forgot-password/verify-otp', data);
  },
  async forgotPasswordReset(data) {
    return axiosApi.post('/api/v1/auth/forgot-password/reset', data);
  },
  async changePassword(data) {
    return axiosApi.post('/api/v1/auth/change-password', data);
  },
};
