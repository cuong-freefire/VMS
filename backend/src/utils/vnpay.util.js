import vnpay from "../config/vnpay.config.js";
import logger from '../config/logger.config.js';
import { ProductCode, VnpLocale } from 'vnpay/vnpay';

export function createPaymentUrl(order) {
    return vnpay.buildPaymentUrl({
        vnp_Amount: order.amount,
        vnp_IpAddr: '127.0.0.1', // Địa chỉ ip client
        vnp_TxnRef: order.id, //Mã đơn hàng (ko dc trùng lặp)
        vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: process.env.VNPAY_RETURN_URL, // Trang frontend trả về
        vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en' (chọn ngôn ngữ hiển thị trên trang thanh toán của VNPay)
    },
        {
            logger: {
                type: 'all',
                loggerFn: (message) => logger.info(message),
            },
        },);
}