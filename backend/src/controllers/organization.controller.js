/**
 * Organization Controller
 *
 * Xử lý HTTP requests liên quan đến Organization.
 * Controller chỉ làm nhiệm vụ: nhận request, gọi Service, trả về response.
 * KHÔNG chứa business logic.
 *
 * @module controllers/organization.controller
 */

import organizationService from '../services/organization.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

class OrganizationController {
  /**
   * GET /api/v1/organizations
   * Lấy danh sách organizations với phân trang và tìm kiếm.
   */
  async list(req, res) {
    try {
      const result = await organizationService.getOrganizations(req.user, req.query);
      return res.status(200).json(
        successResponse(result, 'Lấy danh sách tổ chức thành công')
      );
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json(
        errorResponse(error.message, error.code || 'INTERNAL_ERROR')
      );
    }
  }

  /**
   * GET /api/v1/organizations/:id
   * Lấy chi tiết organization theo ID.
   */
  async getById(req, res) {
    try {
      const organization = await organizationService.getOrganizationById(req.user, req.params.id);
      return res.status(200).json(
        successResponse(organization, 'Lấy thông tin tổ chức thành công')
      );
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json(
        errorResponse(error.message, error.code || 'INTERNAL_ERROR')
      );
    }
  }

  /**
   * POST /api/v1/organizations
   * Tạo organization mới (Admin only).
   */
  async create(req, res) {
    try {
      const organization = await organizationService.createOrganization(req.body);
      return res.status(201).json(
        successResponse(organization, 'Tạo tổ chức thành công')
      );
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json(
        errorResponse(error.message, error.code || 'INTERNAL_ERROR')
      );
    }
  }

  /**
   * PUT /api/v1/organizations/:id
   * Cập nhật organization (Admin only).
   */
  async update(req, res) {
    try {
      const organization = await organizationService.updateOrganization(req.params.id, req.body);
      return res.status(200).json(
        successResponse(organization, 'Cập nhật tổ chức thành công')
      );
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json(
        errorResponse(error.message, error.code || 'INTERNAL_ERROR')
      );
    }
  }
}

export default new OrganizationController();