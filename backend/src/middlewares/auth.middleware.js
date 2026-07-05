// Middleware để kiểm tra phiên đăng nhập hợp lệ. (Tuyệt đối ko sửa đổi)

import * as authRepository from "../repositories/auth.repository.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { errorResponse } from "../utils/response.util.js";

export default async function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json(
            errorResponse('Vui lòng đăng nhập.', 'UNAUTHORIZED')
        )
    }

    const decode = verifyAccessToken(token);
    const checkJti = decode?.jti;
    const userId = decode?.userId;

    if (!decode || !checkJti || !userId) {
        return res.status(401).json(
            errorResponse('Phiên đăng nhập không hợp lệ.', 'TOKEN_INVALID')
        )
    }

    const currentJti = await authRepository.getJtiByUserId(userId);

    if (!currentJti) {
        return res.status(401).json(
            errorResponse('Phiên đăng nhập không hợp lệ.', 'TOKEN_INVALID')
        )
    }

    if (checkJti !== currentJti) {
        return res.status(401).json(
            errorResponse(
                'Tài khoản của bạn đã được đăng nhập trên một thiết bị khác.',
                'LOGGED_IN_ELSEWHERE' // Mã lỗi riêng để Front-end dễ xử lý hiện popup
            )
        );
    }

    req.user = decode;
    next();
}