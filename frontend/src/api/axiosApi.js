// Nơi cấu hình axios và intercepter để xử lý lỗi theo status.

import axios from 'axios';

const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true, //Gắn cookie
    headers: { 'Content-Type': 'application/json' }
});

axiosApi.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        const code = error.response?.data?.code || 'UNKNOWN_ERROR';
        const status = error.response?.status;
        const detail = error.response?.data?.detail || 'An error occurred';
        const pathName = window.location.pathname;
        const requestUrl = error.config?.url || '';
        const isGetMe = requestUrl.includes('/user/me') && error.config?.method === 'get';

        // Đây là nơi FE "hứng" và xử lý Status Code từ BE ném về
        if (status === 401 && pathName !== '/login' && !requestUrl.includes('logout') && !isGetMe) {
            window.location.href = '/login'; // FE chủ động điều hướng về trang Login
        }

        if (status === 403 && isGetMe) {
            console.error('[AXIOS 403] getMe rejected (not redirecting)', { code, message, status });
        }

        else if (status === 403 && !isGetMe) {
            console.error('[AXIOS 403] redirecting to /403-unauthorized', { url: requestUrl, method: error.config?.method, code, message, status });
            window.location.href = '/403-unauthorized'; // FE đá sang trang cấm truy cập
        }

        else if (status === 500) {
            // FE có thể lấy thêm err.message hoặc err.code do BE gửi để hiển thị cho chi tiết
            const backendMessage = error.response.data?.message || "LÃ¡Â»â€”i hÃ¡Â»â€¡ thÃ¡Â»â€˜ng";
            console.error("HÃ¡Â»â€¡ thÃ¡Â»â€˜ng BE Ã„â€˜ang bÃ¡Â»â€¹ sÃ¡ÂºÂ­p: ", backendMessage);
        }


        return Promise.reject({ message, code, status, detail }); // Chuyển tiếp response error thành lỗi ném vô catch
    }
);

export default axiosApi;
