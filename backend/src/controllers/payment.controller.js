import {
    IpnFailChecksum,
    IpnOrderNotFound,
    IpnInvalidAmount,
    InpOrderAlreadyConfirmed,
    IpnUnknownError,
    IpnSuccess,
} from 'vnpay';

import vnpay from "../config/vnpay.config.js";

/* ... */
export const handleVnpayIpn = async (req, res) => {
    try {
        const verify = vnpay.verifyIpnCall(req.query);
        if (!verify.isVerified) {
            return res.json(IpnFailChecksum);
        }

        if (!verify.isSuccess) {
            return res.json(IpnUnknownError);
        }

        // Tìm đơn hàng trong cơ sở dữ liệu
        const foundOrder = await findOrderById(verify.vnp_TxnRef); // Phương thức tìm đơn hàng theo id, bạn cần tự triển khai

        // Nếu không tìm thấy đơn hàng hoặc mã đơn hàng không khớp
        if (!foundOrder || verify.vnp_TxnRef !== foundOrder.orderId) {
            return res.json(IpnOrderNotFound);
        }

        // Nếu số tiền thanh toán không khớp
        if (verify.vnp_Amount !== foundOrder.amount) {
            return res.json(IpnInvalidAmount);
        }

        // Nếu đơn hàng đã được xác nhận trước đó
        if (foundOrder.status === 'completed') {
            return res.json(InpOrderAlreadyConfirmed);
        }

        /**
         * Sau khi xác thực đơn hàng thành công,
         * bạn có thể cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
         */
        foundOrder.status = 'completed';
        await updateOrder(foundOrder); // Hàm cập nhật trạng thái đơn hàng, bạn cần tự triển khai

        // Sau đó cập nhật trạng thái trở lại cho VNPay để họ biết bạn đã xác nhận đơn hàng
        return res.json(IpnSuccess);
    } catch (error) {
        /**
         * Xử lý các ngoại lệ
         * Ví dụ: dữ liệu không đủ, dữ liệu không hợp lệ, lỗi cập nhật cơ sở dữ liệu
         */
        console.log(`verify error: ${error}`);
        return res.json(IpnUnknownError);
    }
};