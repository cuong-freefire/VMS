// Cấu trúc response chung cho toàn dự án (Tuyệt đối ko sửa đổi)
// Ví dụ: 
/*
FAIL:
    return res.status(401).json(
    errorResponse('Email hoặc mật khẩu chưa chính xác.', 'UNAUTHORIZED')
    )

SUCCESS:
    return res.status(200).json(
    successResponse(user, 'Đăng nhập thành công')
    )
*/

export function errorResponse(message, code, details = null) {
    return {
        success: false,
        message,
        code,
        details
    };
}


export function successResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data
    }
}

// Hàm tạo error theo cấu trúc dành riêng cho service ném về lỗi.
export class ServiceError extends Error {
    constructor(message, status, code, details = null) {
        super(message);

        this.status = status;
        this.code = code;
        this.details = details;
    }
}