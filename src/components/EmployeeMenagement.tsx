import React, {useState} from 'react';

interface Employee {
    id: string;
    name: string;
}

interface EmployeeManagementProps {
    calendarId?: string;
    employees: Employee[];
    onAddEmployee: (name: string) => void;
    onDeleteEmployee: (employeeId: string) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
                                                                          employees,
                                                                          onAddEmployee,
                                                                          onDeleteEmployee
                                                                      }) => {
    const [newEmployeeName, setNewEmployeeName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEmployeeName.trim()) {
            onAddEmployee(newEmployeeName.trim());
            setNewEmployeeName('');
        }
    };

    return (
        <div className="mb-8 max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Сотрудники</h2>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="Имя сотрудника"
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Добавить
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {employees.map(employee => (
                    <div
                        key={employee.id}
                        className="flex justify-between items-center border border-gray-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <span className="font-medium text-gray-800">{employee.name}</span>
                        <button
                            onClick={() => onDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-800 border border-red-600 px-3 py-1 rounded hover:bg-red-50 transition-all duration-200 text-sm"
                        >
                            Удалить
                        </button>
                    </div>
                ))}
            </div>

            {employees.length === 0 && (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    Нет сотрудников. Добавьте первого сотрудника.
                </div>
            )}
        </div>
    );
};