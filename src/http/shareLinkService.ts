import $api from './index';

export const shareLinkService = {
    async createShareLink(calendarId: string) {
        const response = await $api.post(`/calendar/${calendarId}/share-links`);
        return response.data;
    },

    async getShareLinks(calendarId: string) {
        const response = await $api.get(`/calendar/${calendarId}/share-links`);
        return response.data;
    },

    async deactivateShareLink(shareLinkId: string) {
        const response = await $api.put(`/share-links/${shareLinkId}/deactivate`);
        return response.data;
    },

    async activateShareLink(shareLinkId: string) {
        const response = await $api.put(`/share-links/${shareLinkId}/activate`);
        return response.data;
    },

    async deleteShareLink(shareLinkId: string) {
        const response = await $api.delete(`/share-links/${shareLinkId}`);
        return response.data;
    },

    async getCalendarByToken(token: string) {
        const response = await $api.get(`/shared/calendar/${token}`);
        return response.data;
    },

    async validateToken(token: string) {
        const response = await $api.get(`/shared/validate/${token}`);
        return response.data;
    }
};