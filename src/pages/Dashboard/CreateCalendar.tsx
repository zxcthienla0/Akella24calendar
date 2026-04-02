import React, {useState} from 'react';
import {calendarService} from '../../http/calendarService';

interface CreateCalendarProps {
    onCancel: () => void;
    onCalendarCreated: () => void;
}

export const CreateCalendar: React.FC<CreateCalendarProps> = ({onCancel, onCalendarCreated}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setError('');

        try {
            await calendarService.createCalendar({
                name: name.trim(),
                description: description.trim() || undefined
            });

            setName('');
            setDescription('');
            onCalendarCreated();
        } catch (err: any) {
            console.log('Frontend: creation error:', err);
            console.log('Frontend: error response:', err.response);
            setError(err.response?.data?.message || 'Ошибка создания календаря');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Создать календарь</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Название календаря *
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Например: Ресторан Москва"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Необязательное описание календаря..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                        >
                            {isLoading ? 'Создание...' : 'Создать календарь'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};