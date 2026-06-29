/**
 * Organization Repository
 *
 * Tầng Repository giao tiếp trực tiếp với Database thông qua Prisma Client.
 * Đây là nơi DUY NHẤT thực hiện database queries cho Organization.
 *
 * @module repositories/organization.repository
 */

import prisma from '../utils/prisma.util.js';

class OrganizationRepository {
  /**
   * Tìm tất cả organizations với phân trang, tìm kiếm và filter.
   * @param {Object} params
   * @param {number} params.page - Trang hiện tại (bắt đầu từ 1)
   * @param {number} params.limit - Số item mỗi trang
   * @param {string} [params.search] - Từ khóa tìm kiếm theo tên
   * @param {boolean} [params.isActive] - Filter theo trạng thái active
   * @returns {Promise<{items: Array, total: number}>}
   */
  async findAll({ page = 1, limit = 20, search, isActive } = {}) {
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive', // Không phân biệt hoa/thường
      };
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const [items, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          website: true,
          logo_url: true,
          description: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
      prisma.organizations.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Tìm organization theo ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.organizations.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });
  }

  /**
   * Tìm organization theo ID kèm danh sách sự kiện gần nhất.
   * @param {number} id
   * @param {number} [limit=10] - Số lượng events tối đa
   * @returns {Promise<Object|null>}
   */
  async findByIdWithRecentEvents(id, limit = 10) {
    return prisma.organizations.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
        events: {
          where: { is_active: true },
          orderBy: { start_date: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            start_date: true,
            end_date: true,
            status: true,
            location: true,
            max_capacity: true,
            approved_participants: true,
          },
        },
      },
    });
  }

  /**
   * Tạo organization mới.
   * @param {Object} data - Dữ liệu organization
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.organizations.create({
      data,
    });
  }

  /**
   * Cập nhật organization.
   * @param {number} id
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.organizations.update({
      where: { id },
      data,
    });
  }

  /**
   * Kiểm tra tên organization đã tồn tại chưa.
   * @param {string} name - Tên organization
   * @param {number} [excludeId] - ID cần loại trừ (khi update)
   * @returns {Promise<boolean>}
   */
  async existsByName(name, excludeId = null) {
    const where = { name };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.organizations.count({ where });
    return count > 0;
  }

  /**
   * Tìm các sự kiện đang hoạt động của organization.
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>}
   */
  async findActiveEvents(orgId) {
    return prisma.events.findMany({
      where: {
        organization_id: orgId,
        is_active: true,
        status: {
          in: ['PUBLISHED', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });
  }
}

export default new OrganizationRepository();