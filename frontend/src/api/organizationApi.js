/**
 * Organization API
 *
 * Giao tiếp với backend API endpoints cho Organization module (UC37-UC40).
 * Sử dụng axiosApi đã được cấu hình sẵn (baseURL, credentials, interceptors).
 *
 * @module api/organizationApi
 */

import axiosApi from './axiosApi';

const BASE = 'api/v1/organizations';

export const organizationApi = {
  /**
   * GET /api/v1/organizations
   * Lấy danh sách tổ chức với phân trang và tìm kiếm.
   * @param {Object} params - { page, limit, search }
   * @returns {Promise<Object>} { items, pagination }
   */
  getOrganizations(params = {}) {
    return axiosApi.get(BASE, { params });
  },

  /**
   * GET /api/v1/organizations/:id
   * Lấy chi tiết tổ chức.
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Chi tiết tổ chức
   */
  getOrganizationById(id) {
    return axiosApi.get(`${BASE}/${id}`);
  },

  /**
   * POST /api/v1/organizations
   * Tạo tổ chức mới (Admin only).
   * @param {Object} data - Dữ liệu tổ chức
   * @returns {Promise<Object>} Tổ chức vừa tạo
   */
  createOrganization(data) {
    return axiosApi.post(BASE, data);
  },

  /**
   * PUT /api/v1/organizations/:id
   * Cập nhật tổ chức (Admin only).
   * @param {number} id - Organization ID
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Tổ chức đã cập nhật
   */
  updateOrganization(id, data) {
    return axiosApi.put(`${BASE}/${id}`, data);
  },
};