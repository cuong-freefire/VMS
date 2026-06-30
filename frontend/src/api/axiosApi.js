import axios from 'axios';

const API_V1_PREFIX = '/api/v1';
const legacyApiBaseUrl = process.env.REACT_APP_LEGACY_API_BASE_URL || 'http://localhost:5000';
const eventApiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

function normalizeApiV1BaseUrl(baseUrl) {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    if (cleanBaseUrl.endsWith(API_V1_PREFIX)) {
        return cleanBaseUrl;
    }

    return `${cleanBaseUrl}${API_V1_PREFIX}`;
}

function handleApiError(error) {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
        return Promise.reject({
            message: 'Request canceled',
            code: 'ERR_CANCELED',
            isCanceled: true
        });
    }

    const data = error.response?.data || {};
    const message = data.message || data.error || error.message || 'An error occurred';
    const code = data.code || 'UNKNOWN_ERROR';
    const status = error.response?.status;
    const detail = data.detail || data.details || null;
    const pathName = window.location.pathname;
    const requiresAuth = error.config?.requiresAuth === true;
    const silentAuth = error.config?.silentAuth === true;

    if (status === 401 && requiresAuth && !silentAuth && pathName !== '/login') {
        alert('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
        window.location.href = '/login';
    } else if (status === 403 && requiresAuth && !silentAuth) {
        window.location.href = '/403-unauthorized';
    } else if (status === 500) {
        console.error('Backend error:', message);
    }

    return Promise.reject({ message, code, status, detail });
}

const axiosApi = axios.create({
    baseURL: legacyApiBaseUrl,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

export const eventDiscoveryApi = axios.create({
    baseURL: normalizeApiV1BaseUrl(eventApiBaseUrl),
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

axiosApi.interceptors.response.use((response) => response.data, handleApiError);
eventDiscoveryApi.interceptors.response.use((response) => response.data, handleApiError);

export default axiosApi;
