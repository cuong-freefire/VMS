import axiosApi from "../api/axiosApi"

const isMock = false;

export const authService = {
    async login(data) {
        if(isMock){
            return {
                mock: 'dữ liệu mock'
            }
        }
        return axiosApi.post('auth/login', data)
    }
} 