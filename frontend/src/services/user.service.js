import axiosApi from "../api/axiosApi.js";

export const userService = {
    async getMe() {
        return axiosApi.get('user/me')
    }
} 