import React, { useState } from 'react';
import { CalendarList } from './CalendarList';
import { CreateCalendar } from './CreateCalendar';

export const Dashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshCalendars = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-3 shadow">
                <div className="max-w-7xl mx-auto py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Мои календари</h1>
                    <button
                        onClick={() => setCurrentView('create')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Создать календарь
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6">
                {currentView === 'list' && (
                    <CalendarList
                        onAddCalendar={() => setCurrentView('create')}
                        refreshTrigger={refreshTrigger}
                    />
                )}
                {currentView === 'create' && (
                    <CreateCalendar
                        onCancel={() => setCurrentView('list')}
                        onCalendarCreated={() => {
                            setCurrentView('list');
                            refreshCalendars();
                        }}
                    />
                )}
            </main>
        </div>
    );
};