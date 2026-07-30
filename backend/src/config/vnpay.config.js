import { VNPay } from 'vnpay/vnpay';
import logger from './logger.config.js';

// Khởi tạo tham số cổng thanh toán vnpay sandbox

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMN_CODE,
    secureSecret: process.env.VNP_HASH_SECRET,
    vnpayHost: process.env.VNP_HOST,

    testMode: true, // tùy chọn, ghi đè vnpayHost thành sandbox nếu là true
    hashAlgorithm: 'SHA512', // tùy chọn

    /**
     * Bật/tắt ghi log
     * Nếu enableLog là false, loggerFn sẽ không được sử dụng trong bất kỳ phương thức nào
     */
    enableLog: true, // tùy chọn
    loggerFn: (message) => logger.info(message), // tùy chọn

    /**
     * Tùy chỉnh các đường dẫn API của VNPay
     * Thường không cần thay đổi trừ khi:
     * - VNPay cập nhật đường dẫn của họ
     * - Có sự khác biệt giữa môi trường sandbox và production
     */
    endpoints: {
        // Đường dẫn payment
        paymentEndpoint: process.env.VNP_PAYMENT_ENDPOINT,
        // Tra cứu giao dịch + hoàn tiền
        queryDrRefundEndpoint: process.env.VNP_QUERY_DR_REFUND_ENDPOINT,
        // Lấy danh sách ngân hàng hỗ trợ
        getBankListEndpoint:  process.env.VNP_BANK_LIST_ENDPOINT,
    }, // tùy chọn
});

export default vnpay;