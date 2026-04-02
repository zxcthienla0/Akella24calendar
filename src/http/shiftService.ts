import $api from './index.ts';

export const shiftService = {
    async getShifts(calendarId: string) {
        const response = await $api.get(`/calendar/${calendarId}/shifts`);
        return response.data;
    },

    async getShiftsByPeriod(calendarId: string, startDate: Date, endDate: Date) {
        const response = await $api.get(`/calendar/${calendarId}/shifts`, {
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });
        return response.data;
    },

    async createShift(calendarId: string, employeeId: string, date: Date, shiftType: string) {
        const response = await $api.post(`/calendar/${calendarId}/shifts`, {
            employeeId,
            date: date.toISOString(),
            shiftType
        });
        return response.data;
    },

    async updateShift(shiftId: string, shiftType: string, notes?: string) {
        const response = await $api.put(`/shifts/${shiftId}`, {
            shiftType,
            notes
        });
        return response.data;
    },

    async deleteShift(shiftId: string) {
        const response = await $api.delete(`/shifts/${shiftId}`);
        return response.data;
    }
};