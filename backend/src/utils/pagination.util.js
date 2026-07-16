/**
 * Pagination Utility
 *
 * Helper xử lý phân trang cho danh sách kết quả.
 * Chuyển đổi query params (page, limit) thành Prisma skip/take.
 * Tính toán metadata pagination (totalPages).
 *
 * Owner: Member 4 - DucNM (UC26)
 */

import { ServiceError } from './response.util.js';

/**
 * Parse và validate pagination params, trả về Prisma-compatible options.
 *
 * @param {Object} query - Query params từ request
 * @param {number} [query.page=1] - Số trang hiện tại (bắt đầu từ 1)
 * @param {number} [query.limit=20] - Số items mỗi trang (min: 1, max: 100)
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 * @throws {ServiceError} Nếu page hoặc limit không hợp lệ
 */
export function parsePagination(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;

    if (isNaN(page) || page < 1) {
        throw new ServiceError(
            'Tham số page không hợp lệ',
            400,
            'INVALID_PAGE'
        );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new ServiceError(
            'Tham số limit phải từ 1 đến 100',
            400,
            'INVALID_LIMIT'
        );
    }

    return {
        skip: (page - 1) * limit,
        take: limit,
        page,
        limit
    };
}

/**
 * Tạo pagination metadata cho response.
 *
 * @param {number} total - Tổng số records
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số items mỗi trang
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export function createPaginationMeta(total, page, limit) {
    return {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0
    };
}