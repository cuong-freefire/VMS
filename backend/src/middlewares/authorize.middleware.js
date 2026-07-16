/**
 * Authorization Middleware
 *
 * Kiểm tra role của người dùng sau khi đã xác thực JWT.
 * Sử dụng kết hợp với authMiddleware để phân quyền endpoint.
 *
 * Usage:
 *   import authMiddleware from './auth.middleware.js';
 *   import authorize from './authorize.middleware.js';
 *   router.get('/users', authMiddleware, authorize('ADMIN'), handler);
 *
 * Owner: Member 4 - DucNM (UC26)
 */

import { errorResponse } from '../utils/response.util.js';
import userRepository from "../repositories/user.repository.js";

/**
 * Middleware kiểm tra role người dùng.
 * @param  {...string} allowedRoles - Các role được phép truy cập (VD: 'ADMIN', 'MANAGER')
 * @returns {Function} Express middleware
 */
export default function authorize(...allowedRoles) {
    return async (req, res, next) => {
        try {
            // Role ID được lấy từ JWT sau khi authMiddleware xác thực
            const userRoleId = req.user?.role_id;
            // Tra cứu tên role từ database để so sánh với allowedRoles
            const userRoleName = await userRepository.findRoleNameById(userRoleId);

            if (!userRoleName || !allowedRoles.includes(userRoleName)) {
                return res.status(403).json(
                    errorResponse(
                        'Bạn không có quyền truy cập tài nguyên này',
                        'FORBIDDEN'
                    )
                );
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}