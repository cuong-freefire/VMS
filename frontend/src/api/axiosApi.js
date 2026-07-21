// NÃ†Â¡i cÃ¡ÂºÂ¥u hÃƒÂ¬nh axios vÃƒÂ  intercepter Ã„â€˜Ã¡Â»Æ’ xÃ¡Â»Â­u lÃƒÂ½ lÃ¡Â»â€”i theo status.

import axios from 'axios';

const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true, //GÃ¡ÂºÂ¯n cookie
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

        // Ã„ÂÃƒÂ¢y lÃƒÂ  nÃ†Â¡i FE "hÃ¡Â»Â©ng" vÃƒÂ  xÃ¡Â»Â­ lÃƒÂ½ Status Code tÃ¡Â»Â« BE nÃƒÂ©m vÃ¡Â»Â
        if (status === 401 && pathName !== '/login' && !requestUrl.includes('logout') && !isGetMe) {
            window.location.href = '/login'; // FE chÃ¡Â»Â§ Ã„â€˜Ã¡Â»â„¢ng Ã„â€˜iÃ¡Â»Âu hÃ†Â°Ã¡Â»â€ºng vÃ¡Â»Â trang Login
        }

        if (status === 403 && isGetMe) {
            console.error('[AXIOS 403] getMe rejected (not redirecting)', { code, message, status });
        }

        else if (status === 403 && !isGetMe) {
            console.error('[AXIOS 403] redirecting to /403-unauthorized', { url: requestUrl, method: error.config?.method, code, message, status });
            window.location.href = '/403-unauthorized'; // FE Ã„â€˜ÃƒÂ¡ sang trang cÃ¡ÂºÂ¥m truy cÃ¡ÂºÂ­p
        }

        else if (status === 500) {
            // FE cÃƒÂ³ thÃ¡Â»Æ’ lÃ¡ÂºÂ¥y thÃƒÂªm err.message hoÃ¡ÂºÂ·c err.code do BE gÃ¡Â»Â­i Ã„â€˜Ã¡Â»Æ’ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ cho chi tiÃ¡ÂºÂ¿t
            const backendMessage = error.response.data?.message || "LÃ¡Â»â€”i hÃ¡Â»â€¡ thÃ¡Â»â€˜ng";
            console.error("HÃ¡Â»â€¡ thÃ¡Â»â€˜ng BE Ã„â€˜ang bÃ¡Â»â€¹ sÃ¡ÂºÂ­p: ", backendMessage);
        }


        return Promise.reject({ message, code, status, detail }); // ChuyÃ¡Â»Æ’n tiÃ¡ÂºÂ¿p response error thÃƒÂ nh lÃ¡Â»â€”i nÃƒÂ©m vÃƒÂ´ catch
    }
);

export default axiosApi;
