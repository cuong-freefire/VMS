import { signAccessToken } from "../utils/jwt.util.js";
import { ServiceError } from "../utils/response.util.js";

export function loginService(email, password) {

    const accounts = [
        { email: 'cuong123', password: 'cuong123', name: 'Tèo' },
        { email: 'cute73998@gmail.com', password: 'cuong123', name: 'Trung' },
        { email: 'tandava2005@gmail.com', password: 'cuong123', name: 'Phú' }
    ]

    const user = accounts.find(acc => acc.email === email && acc.password === password);

    if (!user) {
        throw new ServiceError(
            "Email hoặc mật khẩu chưa chính xác",
            401,
            "UNAUTHORIZED"
        );
    }

    const token = signAccessToken(user)

    return {
        token, user
    }

}