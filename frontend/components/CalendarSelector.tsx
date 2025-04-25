import * as React from 'react';
import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type Props = {
  onDateSelect: (date: Date) => void;
};

const CalendarSelector: React.FC<Props> = ({ onDateSelect }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);


    const handleChange = (date: Date) => {
        setSelectedDate(date);
        onDateSelect(date);
    };

    return (
    <div style={{ padding: '1rem' }}>
        <h2>日付を選択</h2>
        <p>予約したい日を選んでください</p>
        <Calendar
            onChange={handleChange}
            value={selectedDate}
            locale="ja-JP"
        />

    </div>
    );
};

export default CalendarSelector;