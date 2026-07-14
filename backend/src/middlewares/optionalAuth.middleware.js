/**
 * Optional Authentication Middleware
 *
 * Giống authMiddleware nhưng KHÔNG trả về 401 nếu không có token.
 * Nếu có token hợp lệ → set req.user = decoded payload
 * Nếu không có token hoặc token không hợp lệ → set req.user = null
 *
 * Dùng cho các endpoint public nhưng có thể mở rộng nếu user đã đăng nhập
 * (VD: GET /api/v1/categories — Guest không cần auth, nhưng Manager thấy thêm inactive)
 *
 * Owner: Member 4 - DucNM (UC31)
 */

import { verifyAccessToken } from '../utils/jwt.util.js';

export default function optionalAuth(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        req.user = null;
        return next();
    }

    const decode = verifyAccessToken(token);

    if (!decode || !decode.jti || !decode.user_id) {
        req.user = null;
        return next();
    }

    req.user = decode;
    next();
}