import axiosApi from "../api/axiosApi.js";

export const eventService = {
    async getEventDetail(id) {
        return axiosApi.get(`/api/v1/events/${id}`);
    },
};