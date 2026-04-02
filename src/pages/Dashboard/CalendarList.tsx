import {useNavigate} from 'react-router-dom';
import React, {useState, useEffect} from 'react';
import {calendarService} from '../../http/calendarService';

interface Calendar {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

interface CalendarListProps {
    onAddCalendar: () => void;
    refreshTrigger?: number;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

interface EditCalendarData {
    name: string;
    description?: string;
}

export const CalendarList: React.FC<CalendarListProps> = ({
                                                              onAddCalendar,
                                                              refreshTrigger
                                                          }) => {
    const navigate = useNavigate();
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
    const [editFormData, setEditFormData] = useState<EditCalendarData>({
        name: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCalendars();
    }, [refreshTrigger]);

    const loadCalendars = async () => {
        try {
            setIsLoading(true);
            const calendarsData = await calendarService.getCalendars();
            setCalendars(calendarsData as Calendar[]);
        } catch (error: unknown) {
            console.error('Ошибка загрузки календарей:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCalendar = async (calendarId: string) => {
        if (!window.confirm('Удалить календарь?')) return;

        try {
            await calendarService.deleteCalendar(calendarId);
            setCalendars(calendars.filter(cal => cal.id !== calendarId));
        } catch (error: unknown) {
            const err = error as ApiError;
            setError(err.response?.data?.message || 'Ошибка удаления календаря');
        }
    };

    const handleEditCalendar = (calendarId: string) => {
        const calendarToEdit = calendars.find(cal => cal.id === calendarId);
        if (calendarToEdit) {
            setEditingCalendar(calendarToEdit);
            setEditFormData({
                name: calendarToEdit.name,
                description: calendarToEdit.description || ''
            });
            setIsEditModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditingCalendar(null);
        setEditFormData({ name: '', description: '' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCalendar) return;

        setIsSubmitting(true);
        try {
            await calendarService.updateCalendar(editingCalendar.id, editFormData);

            setCalendars(calendars.map(cal =>
                cal.id === editingCalendar.id
                    ? { ...cal, ...editFormData }
                    : cal
            ));

            handleCloseModal();
        } catch (error: unknown) {
            const err = error as ApiError;
            setError(err.response?.data?.message || 'Ошибка обновления календаря');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Загрузка календарей...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
                <button
                    onClick={loadCalendars}
                    className="ml-4 text-red-800 underline"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div>
            {calendars.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-4">У вас пока нет календарей</div>
                    <button
                        onClick={onAddCalendar}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Создать первый календарь
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calendars.map((calendar) => (
                        <div
                            key={calendar.id}
                            className="border border-gray-200 rounded-lg p-4 shadow-md transition-shadow"
                        >
                            <h3 className="font-semibold text-lg mb-2">{calendar.name}</h3>
                            {calendar.description && (
                                <p className="text-gray-600 text-sm mb-3">{calendar.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">
                                    Создан: {new Date(calendar.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => navigate(`/calendar/${calendar.id}`)}
                                        className="text-blue-600 hover:text-indigo-800 text-sm border rounded p-1 border-blue-600"
                                    >
                                        Открыть
                                    </button>
                                    <button
                                        onClick={() => handleEditCalendar(calendar.id)}
                                        className="text-blue-600 hover:text-blue-800 text-sm border rounded p-1 border-blue-600"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCalendar(calendar.id)}
                                        className="text-red-600 hover:text-red-800 text-sm border rounded p-1 border-red-600"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold">Редактировать календарь</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitEdit} className="p-6">
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Название календаря *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Описание
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !editFormData.name.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};