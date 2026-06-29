/**
 * Organization Service
 *
 * Tầng Service xử lý business logic và validation cho Organization.
 * BẮT BUỘC: Business logic và validation ở Service layer, KHÔNG ở Controller hay Repository.
 *
 * @module services/organization.service
 */

import organizationRepository from '../repositories/organization.repository.js';
import { ServiceError } from '../utils/response.util.js';

class OrganizationService {
  /**
   * Lấy danh sách organizations với phân trang, tìm kiếm và phân quyền.
   *
   * @param {Object} user - Thông tin user từ JWT { id, role }
   * @param {Object} query - Query params { page, limit, search }
   * @returns {Promise<Object>} { items, pagination }
   * @throws {ServiceError} Nếu có lỗi xử lý
   */
  async getOrganizations(user, query) {
    const { page = 1, limit = 20, search = '' } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    // Phân quyền: Admin thấy cả active và inactive
    // Manager/Staff chỉ thấy is_active = true
    const isActive = user.role === 'ADMIN' ? undefined : true;

    const { items, total } = await organizationRepository.findAll({
      page: pageNum,
      limit: limitNum,
      search: search.trim(),
      isActive,
    });

    // Map dữ liệu trả về: chuyển _count.events thành event_count
    const mappedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      website: item.website,
      logo_url: item.logo_url,
      description: item.description,
      is_active: item.is_active,
      event_count: item._count?.events || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      items: mappedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Lấy chi tiết organization theo ID.
   *
   * @param {Object} user - Thông tin user từ JWT
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Chi tiết organization kèm recent events
   * @throws {ServiceError} Nếu không tìm thấy hoặc không có quyền
   */
  async getOrganizationById(user, id) {
    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) {
      throw new ServiceError('ID tổ chức không hợp lệ.', 400, 'BAD_REQUEST');
    }

    const organization = await organizationRepository.findByIdWithRecentEvents(orgId);

    if (!organization) {
      throw new ServiceError('Không tìm thấy tổ chức.', 404, 'NOT_FOUND');
    }

    // Manager/Staff không được xem organization inactive
    if (!organization.is_active && user.role !== 'ADMIN') {
      throw new ServiceError('Không tìm thấy tổ chức.', 404, 'NOT_FOUND');
    }

    return {
      id: organization.id,
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      address: organization.address,
      website: organization.website,
      logo_url: organization.logo_url,
      description: organization.description,
      is_active: organization.is_active,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
      event_count: organization._count?.events || 0,
      recent_events: organization.events?.map((event) => ({
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
        location: event.location,
        max_capacity: event.max_capacity,
        approved_participants: event.approved_participants,
      })) || [],
    };
  }

  /**
   * Tạo organization mới.
   *
   * @param {Object} data - Dữ liệu organization { name, email, phone, address, website, logo_url, description }
   * @returns {Promise<Object>} Organization vừa tạo
   * @throws {ServiceError} Nếu validation thất bại hoặc tên đã tồn tại
   */
  async createOrganization(data) {
    const { name, email, phone, address, website, logo_url, description } = data;

    // Kiểm tra tên không được để trống
    if (!name || !name.trim()) {
      throw new ServiceError('Tên tổ chức là bắt buộc.', 400, 'BAD_REQUEST');
    }

    // Kiểm tra tên đã tồn tại
    const exists = await organizationRepository.existsByName(name.trim());
    if (exists) {
      throw new ServiceError('Tên tổ chức đã tồn tại.', 409, 'CONFLICT');
    }

    // Tạo organization
    const organization = await organizationRepository.create({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
      website: website || null,
      logo_url: logo_url || null,
      description: description || null,
      is_active: true,
    });

    return organization;
  }

  /**
   * Cập nhật organization.
   *
   * @param {number} id - Organization ID
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Organization đã cập nhật
   * @throws {ServiceError} Nếu không tìm thấy, tên trùng, hoặc vi phạm ràng buộc soft-delete
   */
  async updateOrganization(id, data) {
    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) {
      throw new ServiceError('ID tổ chức không hợp lệ.', 400, 'BAD_REQUEST');
    }

    const existingOrg = await organizationRepository.findById(orgId);
    if (!existingOrg) {
      throw new ServiceError('Không tìm thấy tổ chức.', 404, 'NOT_FOUND');
    }

    const { name, email, phone, address, website, logo_url, description, is_active } = data;

    // Kiểm tra tên nếu có thay đổi
    if (name !== undefined) {
      if (!name.trim()) {
        throw new ServiceError('Tên tổ chức không được để trống.', 400, 'BAD_REQUEST');
      }

      const nameExists = await organizationRepository.existsByName(name.trim(), orgId);
      if (nameExists) {
        throw new ServiceError('Tên tổ chức đã tồn tại.', 409, 'CONFLICT');
      }
    }

    // Kiểm tra ràng buộc soft-delete
    if (is_active === false) {
      if (!existingOrg.is_active) {
        throw new ServiceError('Tổ chức đã bị vô hiệu hóa trước đó.', 400, 'BAD_REQUEST');
      }

      const activeEvents = await organizationRepository.findActiveEvents(orgId);
      if (activeEvents.length > 0) {
        throw new ServiceError(
          'Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động.',
          409,
          'CONFLICT'
        );
      }
    }

    // Cập nhật organization
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (website !== undefined) updateData.website = website || null;
    if (logo_url !== undefined) updateData.logo_url = logo_url || null;
    if (description !== undefined) updateData.description = description || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Chỉ update nếu có thay đổi
    if (Object.keys(updateData).length === 0) {
      throw new ServiceError('Không có dữ liệu để cập nhật.', 400, 'BAD_REQUEST');
    }

    const updatedOrg = await organizationRepository.update(orgId, updateData);
    return updatedOrg;
  }
}

export default new OrganizationService();