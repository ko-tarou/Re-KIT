// pages/index.tsx
import React, { useState } from 'react';
import CalendarSelector from '../components/CalendarSelector';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <main style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px' }}>
        <CalendarSelector onDateSelect={setSelectedDate} />
      </div>

      <div style={{ flex: 2, border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
        <h2>座席を選択</h2>
        <p>
          {selectedDate
            ? `${selectedDate.toLocaleDateString()} の座席を選択してください`
            : 'まずは日付を選んでください'}
        </p>
      </div>
    </main>
  );
}
