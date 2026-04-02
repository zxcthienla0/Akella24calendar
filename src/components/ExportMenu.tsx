import React, { useState } from 'react';

interface Employee {
    id: string;
    name: string;
}

interface Shift {
    id: string;
    date: string;
    shiftType: string;
    employeeId: string;
}

interface ExportMenuProps {
    employees: Employee[];
    shifts: Shift[];
    calendarName: string;
    daysInMonth: Date[];
    currentMonth: Date;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
                                                          employees,
                                                          shifts,
                                                          calendarName,
                                                          daysInMonth,
                                                          currentMonth
                                                      }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const exportAsPrintableTable = () => {
        if (employees.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }

        if (isExporting) return;

        setIsExporting(true);
        try {
            const monthName = currentMonth.toLocaleDateString('ru-RU', {
                month: 'long',
                year: 'numeric'
            });

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${calendarName} - ${monthName}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
        }
        .calendar-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .month-name { 
            font-size: 18px; 
            color: #666; 
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            font-size: 12px;
            margin-bottom: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center; 
        }
        th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
            position: sticky;
            left: 0;
        }
        .employee-name { 
            background-color: white; 
            font-weight: bold; 
            position: sticky;
            left: 0;
            min-width: 120px;
            text-align: left;
        }
        .weekend { 
            background-color: #e6f3ff; 
        }
        .shift-day { background-color: #fff9c4; }
        .shift-night { background-color: #bbdefb; }
        .shift-holiday { background-color: #e1bee7; }
        .shift-leave { background-color: #ffcdd2; }
        .shift-not-working { background-color: #f5f5f5; }
        .Dentist_Day { background-color: #ffffff; }
        .Surgery_Day { background-color: #6cccff; }
        .Computed_Tomography { background-color: #d8d8d8; }
        .nn_day {background-color: #ffffff;}
        .legend { 
            margin-top: 30px; 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px; 
            justify-content: center;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #f9f9f9;
        }
        .legend-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        .legend-color { 
            width: 20px; 
            height: 20px; 
            border: 1px solid #ccc; 
            border-radius: 3px;
        }
        .legend-text {
            font-size: 14px;
        }
        @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            .legend { 
                border: 1px solid #000;
                background: white;
            }
        }
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .instructions h3 {
            margin: 0 0 10px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="calendar-name">${calendarName}</div>
        <div class="month-name">${monthName}</div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="employee-name">Сотрудник</th>
                ${daysInMonth.map(day => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return `
                        <th class="${isWeekend ? 'weekend' : ''}">
                            <div style="font-weight: bold;">${day.getDate()}</div>
                            <div style="font-size: 10px; color: #666;">${day.toLocaleDateString('ru-RU', {weekday: 'short'})}</div>
                        </th>
                    `;
            }).join('')}
            </tr>
        </thead>
        <tbody>
            ${employees.map(employee => `
                <tr>
                    <td class="employee-name">${employee.name}</td>
                    ${daysInMonth.map(day => {
                const shift = shifts.find(s =>
                    s.employeeId === employee.id &&
                    new Date(s.date).toDateString() === day.toDateString()
                );
                const shiftType = shift?.shiftType || 'NOT_WORKING';
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                let shiftClass = '';
                let shiftSymbol = '';
                let shiftTitle = '';

                switch (shiftType) {
                    case 'DAY_SHIFT':
                        shiftClass = 'shift-day';
                        shiftSymbol = 'Д';
                        shiftTitle = 'Дневная смена';
                        break;
                    case 'NIGHT_SHIFT':
                        shiftClass = 'shift-night';
                        shiftSymbol = 'Н';
                        shiftTitle = 'Ночная смена';
                        break;
                    case 'HOLIDAY':
                        shiftClass = 'shift-holiday';
                        shiftSymbol = 'С';
                        shiftTitle = 'Суточная смена';
                        break;
                    case 'LEAVE':
                        shiftClass = 'shift-leave';
                        shiftSymbol = 'О';
                        shiftTitle = 'Отпуск/Больничный';
                        break;
                    case 'DENTIST_DAY':
                        shiftClass = 'Dentist_Day';
                        shiftSymbol = 'СД';
                        shiftTitle = 'Стоматологический день';
                        break;
                    case 'SURGERY_DAY':
                        shiftClass = 'Surgery_Day';
                        shiftSymbol = 'ХД';
                        shiftTitle = 'Хирургический день';
                        break;
                    case 'COMPUTED_TOMOGRAPHY':
                        shiftClass = 'Computed_Tomography';
                        shiftSymbol = 'КТ';
                        shiftTitle = 'Компьютерная томография';
                        break;
                    case 'NN_DAY':
                        shiftClass = 'nn_day';
                        shiftSymbol = 'НН';
                        shiftTitle = 'Смена с Николаем Н.';
                        break;
                    default:
                        shiftClass = 'shift-not-working';
                        shiftSymbol = '-';
                        shiftTitle = 'Не работает';
                }

                return `
                            <td class="${shiftClass} ${isWeekend ? 'weekend' : ''}" title="${employee.name}, ${day.toLocaleDateString()}: ${shiftTitle}">
                                <strong>${shiftSymbol}</strong>
                            </td>
                        `;
            }).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="legend">
        <div class="legend-item">
            <div class="legend-color" style="background-color: #fff9c4;"></div>
            <span class="legend-text">Д - Дневная смена</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #bbdefb;"></div>
            <span class="legend-text">Н - Ночная смена</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #e1bee7;"></div>
            <span class="legend-text">С - Суточная смена</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ffcdd2;"></div>
            <span class="legend-text">О - Отпуск/Больничный</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #f5f5f5;"></div>
            <span class="legend-text">- - Не работает</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ffffff;"></div>
            <span class="legend-text">СД - Стоматологический день</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #6cccff;"></div>
            <span class="legend-text">ХД - Хирургический день</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #d8d8d8;"></div>
            <span class="legend-text">КТ - Компьютерная томография</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ffffff;"></div>
            <span class="legend-text">НН - Смена с Николаем Н.</span>
        </div>
    </div>

    <div class="instructions no-print">
        <h3>📄 Инструкция по сохранению</h3>
        <p><strong>Для печати на принтере:</strong> Нажмите Ctrl+P или используйте меню печати браузера</p>
        <p><strong>Для сохранения как PDF:</strong> В диалоге печати выберите "Сохранить как PDF" или "Microsoft Print to PDF"</p>
        <p><strong>Рекомендации:</strong>В окне печати "Ориентация - Горизонтально"</p>
        <p><strong>Для цветной печати/сохранения:</strong>В окне печати "Дополнительные настройки" -> "Параметры" -> "✅ Фон"</p>
    </div>
</body>
</html>
            `;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();

                printWindow.focus();
            }

            setIsOpen(false);
        } catch (error: any) {
            console.error('Ошибка при создании таблицы для печати:', error);
            alert('Ошибка при создании таблицы для печати');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isExporting ? '⏳ Подготовка...' : '📥 Экспорт'}
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-48">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                        {currentMonth.toLocaleDateString('ru-RU', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                    <button
                        onClick={exportAsPrintableTable}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                    >
                        🖨️ Версия для печати
                    </button>
                </div>
            )}
        </div>
    );
};