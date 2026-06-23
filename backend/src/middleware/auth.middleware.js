// Middleware để kiểm tra phiên đăng nhập hợp lệ. (Tuyệt đối ko sửa đổi)

import { verifyAccessToken } from "../utils/jwt.util.js";
import { errorResponse } from "../utils/response.util.js";

export default function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json(
            errorResponse('Vui lòng đăng nhập.', 'UNAUTHORIZED')
        )
    }

    const decode = verifyAccessToken(token);
    if (!decode) {
        return res.status(401).json(
            errorResponse('Phiên đăng nhập không hợp lệ.', 'TOKEN_INVALID')
        )
    }

    req.user = decode;
    next();
}