import React, {useState, useEffect} from 'react';
import {useParams, Navigate} from 'react-router-dom';
import {shareLinkService} from '../http/shareLinkService';
import {CalendarGrid} from '../components/CalendarGrid';

interface Calendar {
    id: string;
    name: string;
    description?: string;
    employees: Employee[];
    shifts: Shift[];
}

interface Employee {
    id: string;
    name: string;
}

interface Shift {
    id: string;
    date: string;
    shiftType: string;
    employeeId: string;
    employee?: Employee;
}

interface SharedData {
    calendar: Calendar;
    sharedBy: {
        id: string;
        email: string;
        name: string;
    };
    shareLinkId: string;
}

export const SharedCalendarPage: React.FC = () => {
    const {token} = useParams<{ token: string }>();
    const [sharedData, setSharedData] = useState<SharedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            loadSharedCalendar();
        }
    }, [token]);

    const loadSharedCalendar = async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await shareLinkService.getCalendarByToken(token!);
            setSharedData(data);

        } catch (error: any) {
            console.error('Error loading shared calendar:', error);
            setError(error.response?.data?.message || 'Ссылка недействительна или истекла');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Загрузка календаря...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-semibold">Ошибка доступа</h2>
                    <p>{error}</p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    На главную
                </button>
            </div>
        );
    }

    if (!sharedData) {
        return <Navigate to="/" replace/>;
    }

    return (
        <div className="mt-2">
            <div className={"max-w-7xl mx-auto"}>
                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold">{sharedData.calendar.name}</h1>
                            {sharedData.calendar.description && (
                                <p className="text-gray-600 mt-2">{sharedData.calendar.description}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                                📧 Поделился: {sharedData.sharedBy.name} ({sharedData.sharedBy.email})
                            </p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            📋 Общий доступ
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                    <p>🔒 Режим просмотра. Изменения недоступны.</p>
                </div>
            </div>
            <CalendarGrid
                calendarId={sharedData.calendar.id}
                employees={sharedData.calendar.employees || []}
                shifts={sharedData.calendar.shifts || []}
                onShiftChange={() => {}}
                isReadOnly={true}
            />
        </div>
    );
};