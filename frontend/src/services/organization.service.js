/**
 * Organization Service
 *
 * Service layer cho Organization module.
 * Xử lý dữ liệu trước/sau khi gọi API, format dữ liệu cho phù hợp với UI.
 *
 * @module services/organization.service
 */

import { organizationApi } from '../api/organizationApi.js';

class OrganizationService {
  /**
   * Lấy danh sách tổ chức.
   * @param {Object} params - { page, limit, search }
   * @returns {Promise<Object>} { items, pagination }
   */
  async getOrganizations(params = {}) {
    try {
      const response = await organizationApi.getOrganizations(params);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tổ chức:', error.message);
      throw error;
    }
  }

  /**
   * Lấy chi tiết tổ chức.
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Chi tiết tổ chức
   */
  async getOrganizationById(id) {
    try {
      const response = await organizationApi.getOrganizationById(id);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết tổ chức:', error.message);
      throw error;
    }
  }

  /**
   * Tạo tổ chức mới.
   * @param {Object} data - Dữ liệu tổ chức
   * @returns {Promise<Object>} Tổ chức vừa tạo
   */
  async createOrganization(data) {
    try {
      const response = await organizationApi.createOrganization(data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo tổ chức:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật tổ chức.
   * @param {number} id - Organization ID
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Tổ chức đã cập nhật
   */
  async updateOrganization(id, data) {
    try {
      const response = await organizationApi.updateOrganization(id, data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật tổ chức:', error.message);
      throw error;
    }
  }
}

export default new OrganizationService();