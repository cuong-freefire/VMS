import { loginService } from "../services/auth.service.js";
import { setTokenToCookie, signAccessToken } from "../utils/jwt.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

const accounts = [
    { email: 'cuong123', password: 'cuong123', name: 'Tèo' },
    { email: 'cute73998@gmail.com', password: 'cuong123', name: 'Trung' },
    { email: 'tandava2005@gmail.com', password: 'cuong123', name: 'Phú' }
]

export async function login(req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;
        console.log('Email và Password: ' + `${email} | ${password}`)
        const { token, user } = loginService(email, password);
        setTokenToCookie(res, token)
        return res.status(200).json(successResponse(user, 'Đăng nhập thành công'))
    }
    catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || "INTERNAL_SERVER_ERROR",
                    error.details
                )
            );
    }
}