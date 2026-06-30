import axiosApi from "../api/axiosApi.js";

export const userService = {
    async getMe(options = {}) {
        return axiosApi.get('user/me', {
            requiresAuth: true,
            silentAuth: options.silentAuth === true
        })
    }
} 
