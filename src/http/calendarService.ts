import $api from './index.ts';

export interface CreateCalendarData {
    name: string;
    description?: string;
}

export const calendarService = {
    async getCalendars() {
        try {
            const response = await $api.get('/calendar');
            return response.data;
        } catch (error) {
            console.error('❌ Error loading calendars:', error);
            throw error;
        }
    },

    async createCalendar(data: CreateCalendarData) {
        const response = await $api.post<CreateCalendarData[]>('/calendar', data);
        return response.data;
    },

    async deleteCalendar(id: string): Promise<void> {
        const response = await $api.delete(`/calendar/${id}`);
        return response.data;
    },

    async updateCalendar(calendarId: string, data: CreateCalendarData) {
        const response = await $api.put(`/calendar/${calendarId}`, data);
        return response.data;
    }
};