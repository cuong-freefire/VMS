// Hàm dùng chung để ký và verify Token. (Tuyệt đối ko sửa đổi)

import jwt from 'jsonwebtoken';

// Hàm tạo accessToken.
export function signAccessToken(payload) {
    const SECRET = process.env.SECRET_KEY
    const option = {
        expiresIn: '60s' //test 60s
    }
    const accessToken = jwt.sign(payload, SECRET, option)
    return accessToken
}

// Hàm verify token.
export function verifyAccessToken(token) {
    const SECRET = process.env.SECRET_KEY
    try {
        return jwt.verify(token, SECRET)
    }
    catch {
        return null // Token ko hợp lệ
    }
}

// Hàm set Token vào cookie
export function setTokenToCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    })
}