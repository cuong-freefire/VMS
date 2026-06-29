/**
 * Authorization Middleware
 *
 * Kiểm tra role của người dùng có nằm trong danh sách roles được phép không.
 * Sử dụng sau middleware authenticate.
 *
 * @module middleware/authorize.middleware
 */

import { errorResponse } from '../utils/response.util.js';

/**
 * Middleware kiểm tra quyền dựa trên role.
 * @param  {...string} roles - Danh sách roles được phép (VD: 'ADMIN', 'MANAGER', 'STAFF')
 * @returns {Function} Express middleware
 *
 * @example
 * // Chỉ Admin mới được truy cập
 * router.get('/admin/users', authenticate, authorize('ADMIN'), handler);
 *
 * // Admin và Manager được truy cập
 * router.get('/dashboard', authenticate, authorize('ADMIN', 'MANAGER'), handler);
 */
export default function authorize(...roles) {
  return (req, res, next) => {
    // Lấy role từ req.user (được inject bởi authMiddleware)
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json(
        errorResponse('Không có quyền truy cập.', 'FORBIDDEN')
      );
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN')
      );
    }

    next();
  };
}