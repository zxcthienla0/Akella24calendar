import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { employeeService } from '../http/employeeService';
import { shiftService } from '../http/shiftService';

interface Employee {
    id: string;
    name: string;
}

interface Shift {
    id: string;
    date: string;
    shiftType: string;
    employeeId: string;
    notes?: string;
}

interface EmployeeOrder {
    employeeId: string;
    orderIndex: number;
}

interface CalendarGridProps {
    calendarId: string;
    employees: Employee[];
    shifts: Shift[];
    onShiftChange: (employeeId: string, date: Date, shiftType: string) => void;
    isReadOnly?: boolean;
    onMonthDaysUpdate?: (days: Date[]) => void;
    onMonthChange?: (month: Date) => void;
    onEmployeeOrderChange?: (employeeIds: string[]) => void;
    onDataRefresh?: () => void;
}

interface PendingChange {
    employeeId: string;
    date: Date;
    shiftType: string;
    shiftId?: string;
}

const SHIFT_TYPES = [
    {value: 'NOT_WORKING', label: '❌', color: 'bg-gray-200', title: 'Не работает'},
    {value: 'DAY_SHIFT', label: '🌞', color: 'bg-yellow-200', title: 'Дневная смена'},
    {value: 'NIGHT_SHIFT', label: '🌙', color: 'bg-blue-300', title: 'Ночная смена'},
    {value: 'HOLIDAY', label: '🌍', color: 'bg-purple-200', title: 'Суточная смена'},
    {value: 'LEAVE', label: '🏥', color: 'bg-red-200', title: 'Больничный/Отпуск'},
    {value: 'DENTIST_DAY', label: '🦷', color: 'bg-white', title: 'Стоматологический день'},
    {value: 'SURGERY_DAY', label: '🪡', color: 'bg-blue-200', title: 'Хирургический день'},
    {value: 'COMPUTED_TOMOGRAPHY', label: '🖥', color: 'bg-gray-300', title: 'Компьютерная томография'},
    {value: 'NN_DAY', label: '👨🏻‍⚕️', color: 'bg-white', title: 'Смена с Николаем Н.'},
];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
                                                              calendarId,
                                                              employees,
                                                              shifts,
                                                              onShiftChange,
                                                              isReadOnly = false,
                                                              onMonthDaysUpdate,
                                                              onMonthChange,
                                                              onEmployeeOrderChange,
                                                              onDataRefresh
                                                          }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sortByAlphabet, setSortByAlphabet] = useState(false);
    const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [manualOrder, setManualOrder] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const loadEmployeeOrder = async () => {
            try {
                setIsLoading(true);
                setSaveError(null);

                const savedOrder = await employeeService.getEmployeeOrder(calendarId);

                if (savedOrder && savedOrder.length > 0) {
                    const order = savedOrder
                        .sort((a: EmployeeOrder, b: EmployeeOrder) => a.orderIndex - b.orderIndex)
                        .map((item: EmployeeOrder) => item.employeeId);
                    setManualOrder(order);
                } else {
                    setManualOrder(employees.map(emp => emp.id));
                }
            } catch (error) {
                console.error('Ошибка при загрузке порядка сотрудников:', error);
                setSaveError('Не удалось загрузить порядок сотрудников');
                setManualOrder(employees.map(emp => emp.id));
            } finally {
                setIsLoading(false);
            }
        };

        if (calendarId) {
            loadEmployeeOrder();
        }
    }, [calendarId]);

    useEffect(() => {
        const savedChanges = localStorage.getItem(`calendar_${calendarId}_pending`);
        if (savedChanges) {
            try {
                const parsed = JSON.parse(savedChanges).map((change: any) => ({
                    ...change,
                    date: new Date(change.date)
                }));
                setPendingChanges(parsed);
            } catch (error) {
                console.error('Ошибка при восстановлении изменений:', error);
                localStorage.removeItem(`calendar_${calendarId}_pending`);
            }
        }
    }, [calendarId]);

    useEffect(() => {
        const savePendingChangesToStorage = () => {
            if (pendingChanges.length > 0) {
                localStorage.setItem(`calendar_${calendarId}_pending`,
                    JSON.stringify(pendingChanges.map(change => ({
                        ...change,
                        date: change.date.toISOString()
                    })))
                );
            } else {
                localStorage.removeItem(`calendar_${calendarId}_pending`);
            }
        };

        savePendingChangesToStorage();
    }, [pendingChanges, calendarId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingChanges.length > 0 && !isSaving) {
                e.preventDefault();
                e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pendingChanges.length, isSaving]);

    const saveOrderToServer = async (order: string[]) => {
        try {
            setSaveError(null);
            await employeeService.saveEmployeeOrder(calendarId, order);

            if (onEmployeeOrderChange) {
                onEmployeeOrderChange(order);
            }
        } catch (error) {
            console.error('Ошибка при сохранении порядка:', error);
            setSaveError('Не удалось сохранить порядок сотрудников');
        }
    };

    useEffect(() => {
        if (employees.length > 0 && manualOrder.length > 0 && !isLoading) {
            const currentOrder = [...manualOrder];
            const newEmployees = employees.filter(emp => !currentOrder.includes(emp.id));
            const removedEmployees = currentOrder.filter(id => !employees.some(emp => emp.id === id));

            const updatedOrder = currentOrder.filter(id => !removedEmployees.includes(id));

            newEmployees.forEach(emp => {
                updatedOrder.push(emp.id);
            });

            if (updatedOrder.length !== manualOrder.length) {
                setManualOrder(updatedOrder);
                saveOrderToServer(updatedOrder);
            }
        }
    }, [employees, manualOrder.length, isLoading]);

    const sortedEmployees = useMemo(() => {
        if (sortByAlphabet) {
            return [...employees].sort((a: Employee, b: Employee) =>
                a.name.localeCompare(b.name, 'ru')
            );
        } else if (manualOrder.length > 0 && !isLoading) {
            const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
            return manualOrder
                .map(id => employeeMap.get(id))
                .filter((emp): emp is Employee => emp !== undefined);
        }
        return employees;
    }, [employees, sortByAlphabet, manualOrder, isLoading]);

    useEffect(() => {
        generateCalendarDays();
    }, [currentDate]);

    useEffect(() => {
        if (onMonthDaysUpdate) {
            onMonthDaysUpdate(daysInMonth);
        }
    }, [daysInMonth, onMonthDaysUpdate]);

    useEffect(() => {
        if (onMonthChange) {
            onMonthChange(currentDate);
        }
    }, [currentDate, onMonthChange]);

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        setDaysInMonth(days);
    };

    const getShiftForEmployee = (employeeId: string, date: Date): Shift | undefined => {
        return shifts.find(shift =>
            shift.employeeId === employeeId &&
            new Date(shift.date).toDateString() === date.toDateString()
        );
    };

    const getDisplayShiftType = (employeeId: string, date: Date, currentShift: Shift | undefined) => {
        const pendingChange = pendingChanges.find(change =>
            change.employeeId === employeeId &&
            change.date.toDateString() === date.toDateString()
        );

        if (pendingChange) {
            return pendingChange.shiftType;
        }

        return currentShift?.shiftType || 'NOT_WORKING';
    };

    const handleEmployeeHeaderClick = () => {
        setSortByAlphabet(prev => !prev);
        setSelectedEmployeeId(null);
    };

    const handleEmployeeClick = (employeeId: string) => {
        if (sortByAlphabet) return;

        setSelectedEmployeeId(prev =>
            prev === employeeId ? null : employeeId
        );
    };

    const moveEmployeeUp = async () => {
        if (!selectedEmployeeId || sortByAlphabet) return;

        const currentIndex = manualOrder.indexOf(selectedEmployeeId);
        if (currentIndex > 0) {
            const newOrder = [...manualOrder];
            [newOrder[currentIndex - 1], newOrder[currentIndex]] =
                [newOrder[currentIndex], newOrder[currentIndex - 1]];

            setManualOrder(newOrder);
            await saveOrderToServer(newOrder);
        }
    };

    const moveEmployeeDown = async () => {
        if (!selectedEmployeeId || sortByAlphabet) return;

        const currentIndex = manualOrder.indexOf(selectedEmployeeId);
        if (currentIndex < manualOrder.length - 1) {
            const newOrder = [...manualOrder];
            [newOrder[currentIndex], newOrder[currentIndex + 1]] =
                [newOrder[currentIndex + 1], newOrder[currentIndex]];

            setManualOrder(newOrder);
            await saveOrderToServer(newOrder);
        }
    };

    const resetManualOrder = async () => {
        const defaultOrder = employees.map(emp => emp.id);
        setManualOrder(defaultOrder);
        setSelectedEmployeeId(null);
        await saveOrderToServer(defaultOrder);
    };

    const handleShiftClick = useCallback((employeeId: string, date: Date, currentShiftType: string) => {
        if (isReadOnly || isLoading || isSaving) {
            return;
        }

        const currentShift = getShiftForEmployee(employeeId, date);
        const currentIndex = SHIFT_TYPES.findIndex(type => type.value === currentShiftType);
        const nextIndex = (currentIndex + 1) % SHIFT_TYPES.length;
        const nextShiftType = SHIFT_TYPES[nextIndex].value;

        setPendingChanges(prev => {
            const filtered = prev.filter(change =>
                !(change.employeeId === employeeId &&
                    change.date.toDateString() === date.toDateString())
            );

            return [...filtered, {
                employeeId,
                date,
                shiftType: nextShiftType,
                shiftId: currentShift?.id
            }];
        });

        onShiftChange(employeeId, date, nextShiftType);
    }, [isReadOnly, isLoading, isSaving, onShiftChange]);

    const saveAllChanges = async () => {
        if (pendingChanges.length === 0) return;

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const createPromises = [];
            const updatePromises = [];

            for (const change of pendingChanges) {
                const isTempId = change.shiftId && change.shiftId.startsWith('temp_');

                if (change.shiftId && !isTempId) {
                    updatePromises.push(
                        shiftService.updateShift(change.shiftId, change.shiftType)
                    );
                } else {
                    createPromises.push(
                        shiftService.createShift(
                            calendarId,
                            change.employeeId,
                            change.date,
                            change.shiftType
                        )
                    );
                }
            }

            await Promise.all([...createPromises, ...updatePromises]);

            setPendingChanges([]);
            setSaveSuccess(true);

            if (onDataRefresh) {
                onDataRefresh();
            }

            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error) {
            console.error('Ошибка при сохранении изменений:', error);
            setSaveError('Не удалось сохранить изменения. Попробуйте еще раз.');
        } finally {
            setIsSaving(false);
        }
    };

    const cancelChanges = async () => {
        if (pendingChanges.length === 0) return;

        setPendingChanges([]);
        setSaveError(null);

        if (onDataRefresh) {
            onDataRefresh();
        }
    };

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        setCurrentDate(newDate);
    };

    if (employees.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 select-none">
                Добавьте сотрудников для отображения календаря
            </div>
        );
    }

    return (
        <div className="select-none mb-3">
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleEmployeeHeaderClick}
                        className={`px-4 py-2 rounded transition-colors ${
                            sortByAlphabet
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        disabled={isLoading || isSaving}
                        title={sortByAlphabet
                            ? "Нажмите чтобы отключить сортировку по алфавиту"
                            : "Нажмите чтобы включить сортировку по алфавиту"
                        }
                    >
                        {sortByAlphabet ? 'Сортировка по алфавиту' : 'Ручная сортировка'}
                        {(isLoading || isSaving) && ' (загрузка...)'}
                    </button>

                    {!sortByAlphabet && !isLoading && (
                        <div className="flex items-center gap-2">
                            {selectedEmployeeId ? (
                                <>
                                    <span className="text-sm text-gray-600">
                                        Выбран: {employees.find(e => e.id === selectedEmployeeId)?.name}
                                    </span>
                                    <button
                                        onClick={moveEmployeeUp}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        disabled={!selectedEmployeeId || manualOrder.indexOf(selectedEmployeeId) === 0 || isSaving}
                                        title="Переместить вверх"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={moveEmployeeDown}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        disabled={!selectedEmployeeId || manualOrder.indexOf(selectedEmployeeId) === manualOrder.length - 1 || isSaving}
                                        title="Переместить вниз"
                                    >
                                        ↓
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={resetManualOrder}
                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={isSaving}
                                    title="Сбросить порядок сотрудников"
                                >
                                    Сбросить порядок
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {pendingChanges.length > 0 && !isLoading && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 mr-2">
                            Несохраненные изменения: {pendingChanges.length}
                        </span>
                        <button
                            onClick={saveAllChanges}
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <span className="inline-block animate-spin mr-2">⟳</span>
                                    Сохранение...
                                </>
                            ) : (
                                'Сохранить все изменения'
                            )}
                        </button>
                        <button
                            onClick={cancelChanges}
                            disabled={isSaving}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Отмена
                        </button>
                    </div>
                )}
            </div>

            {saveSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                    ✅ Изменения успешно сохранены!
                </div>
            )}

            {saveError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {saveError}
                    <button
                        onClick={() => setSaveError(null)}
                        className="float-right text-red-800 hover:text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            {!sortByAlphabet && (
                <div className="text-sm text-gray-500 mb-4">
                    {isLoading
                        ? "Загрузка порядка сотрудников..."
                        : selectedEmployeeId
                            ? "Кликните на сотрудника для выбора, затем используйте стрелки"
                            : "Кликните на сотрудника чтобы выбрать для перемещения"
                    }
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={goToPreviousMonth}
                    className="bg-white border-black border-1 text-1xl text-black px-4 py-2 rounded transition-colors select-none"
                    disabled={isLoading || isSaving}
                >
                    ←
                </button>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-semibold select-none">
                        {currentDate.toLocaleDateString('ru-RU', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </h2>
                    {sortByAlphabet && (
                        <div className="text-sm text-blue-600 mt-1 select-none">
                            Сортировка по алфавиту
                        </div>
                    )}
                    {(isLoading || isSaving) && (
                        <div className="text-sm text-gray-500 mt-1 select-none">
                            {isSaving ? "Сохранение..." : "Загрузка..."}
                        </div>
                    )}
                </div>

                <button
                    onClick={goToNextMonth}
                    className="bg-white border-black border-1 text-1xl text-black px-4 py-2 rounded transition-colors select-none"
                    disabled={isLoading || isSaving}
                >
                    →
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse select-none">
                    <thead>
                    <tr>
                        <th
                            className={`
                                border border-gray-300 p-2 min-w-24 mr-1 sticky left-0 z-10 
                                select-none transition-colors
                                ${sortByAlphabet
                                ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                : 'bg-white hover:bg-gray-100'
                            }
                                ${(isLoading || isSaving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            onClick={(isLoading || isSaving) ? undefined : handleEmployeeHeaderClick}
                            title={(isLoading || isSaving)
                                ? "Загрузка..."
                                : sortByAlphabet
                                    ? "Нажмите чтобы отключить сортировку по алфавиту"
                                    : "Нажмите чтобы включить сортировку по алфавиту"
                            }
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Сотрудник</span>
                                <div className="flex flex-col ml-1">
                                    <span className={`text-xs ${sortByAlphabet ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {sortByAlphabet ? '↓' : '↕'}
                                    </span>
                                </div>
                            </div>
                        </th>
                        {daysInMonth.map(day => {
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                            return (
                                <th
                                    key={day.toISOString()}
                                    className={`border border-gray-300 p-2 text-center min-w-12 select-none ${
                                        isWeekend ? 'bg-blue-100' : 'bg-white'
                                    } ${(isLoading || isSaving) ? 'opacity-50' : ''}`}
                                >
                                    <div className="text-sm font-medium select-none">
                                        {day.getDate()}
                                    </div>
                                    <div className="text-xs text-gray-500 select-none">
                                        {day.toLocaleDateString('ru-RU', {weekday: 'short'})}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                    </thead>

                    <tbody>
                    {sortedEmployees.map((employee, employeeIndex) => {
                        const isSelected = selectedEmployeeId === employee.id;
                        const isSelectable = !sortByAlphabet && !isLoading && !isSaving;

                        return (
                            <React.Fragment key={employee.id}>
                                <tr>
                                    <td
                                        className={`
                                            border border-gray-300 p-2 font-medium sticky left-0 z-10 
                                            select-none transition-all
                                            ${isSelected
                                            ? 'bg-blue-200 border-blue-400 shadow-inner'
                                            : sortByAlphabet
                                                ? 'bg-blue-50'
                                                : 'bg-white hover:bg-gray-50'
                                        }
                                            ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
                                            ${(isLoading || isSaving) ? 'opacity-50' : ''}
                                        `}
                                        onClick={() => isSelectable && handleEmployeeClick(employee.id)}
                                        title={(isLoading || isSaving)
                                            ? "Загрузка..."
                                            : isSelectable
                                                ? isSelected
                                                    ? "Сотрудник выбран. Используйте кнопки для перемещения"
                                                    : "Кликните чтобы выбрать сотрудника для перемещения"
                                                : "Переключитесь на ручную сортировку для выбора сотрудников"
                                        }
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{employee.name}</span>
                                            {isSelected && (
                                                <span className="text-blue-600 text-sm">✓</span>
                                            )}
                                        </div>
                                    </td>

                                    {daysInMonth.map(day => {
                                        const shift = getShiftForEmployee(employee.id, day);
                                        const displayShiftType = getDisplayShiftType(employee.id, day, shift);
                                        const shiftType = SHIFT_TYPES.find(
                                            type => type.value === displayShiftType
                                        ) || SHIFT_TYPES[0];

                                        const hasPendingChange = pendingChanges.some(change =>
                                            change.employeeId === employee.id &&
                                            change.date.toDateString() === day.toDateString()
                                        );

                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                        return (
                                            <td
                                                key={day.toISOString()}
                                                className={`border border-gray-300 text-center select-none ${
                                                    isReadOnly || isLoading || isSaving
                                                        ? 'cursor-not-allowed opacity-90'
                                                        : 'cursor-pointer hover:opacity-80 hover:shadow-md'
                                                } ${
                                                    isWeekend ? 'bg-blue-100' : 'bg-white'
                                                } ${hasPendingChange ? '' : ''}`}
                                                onClick={() => !isLoading && !isSaving && handleShiftClick(
                                                    employee.id,
                                                    day,
                                                    displayShiftType
                                                )}
                                                title={(isLoading || isSaving)
                                                    ? "Загрузка..."
                                                    : hasPendingChange
                                                        ? `${employee.name}, ${day.toLocaleDateString()}: ${shiftType.title} (не сохранено)`
                                                        : `${employee.name}, ${day.toLocaleDateString()}: ${shiftType.title}`
                                                }
                                            >
                                                <div className={`${shiftType.color} p-2 text-lg select-none`}>
                                                    {shiftType.label}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>

                                {(employeeIndex + 1) % 10 === 0 && employeeIndex !== sortedEmployees.length - 1 && (
                                    <tr>
                                        <td className={`
                                            border border-gray-300 p-2 font-medium sticky left-0 z-10 
                                            select-none bg-gray-100
                                            ${sortByAlphabet ? 'bg-blue-50' : 'bg-gray-100'}
                                            ${(isLoading || isSaving) ? 'opacity-50' : ''}
                                        `}>
                                            <div className="text-sm text-gray-600">Сотрудник</div>
                                        </td>
                                        {daysInMonth.map(day => {
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                            return (
                                                <th
                                                    key={`duplicate-${day.toISOString()}`}
                                                    className={`border border-gray-300 p-2 text-center min-w-12 select-none ${
                                                        isWeekend ? 'bg-blue-100' : 'bg-gray-100'
                                                    } ${(isLoading || isSaving) ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="text-sm font-medium select-none">
                                                        {day.getDate()}
                                                    </div>
                                                    <div className="text-xs text-gray-500 select-none">
                                                        {day.toLocaleDateString('ru-RU', {weekday: 'short'})}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6">
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {SHIFT_TYPES.map(type => (
                        <div key={type.value} className="flex items-center gap-1 select-none">
                            <div className={`${type.color} rounded p-1 text-sm select-none`}>
                                {type.label}
                            </div>
                            <span className="text-sm text-gray-600 select-none">{type.title}</span>
                        </div>
                    ))}
                </div>
                {pendingChanges.length > 0 && (
                    <div className="text-center text-sm text-yellow-600">
                        ⚠️ У вас есть {pendingChanges.length} несохраненных изменений
                    </div>
                )}
            </div>
        </div>
    );
};