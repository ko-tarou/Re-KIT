import React, { useState } from 'react';
import CalendarSelector from '../components/CalendarSelector';
import SeatSelector from '../components/SeatSelector';

type Seat = {
  id: number;
  name: string;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  const handleReservation = () => {
    if (selectedDate && selectedSeat) {
      alert(`${selectedDate.toLocaleDateString()} に ${selectedSeat.name} を予約しました！`);
      // TODO: APIにPOSTする
    }
  };

  return (
    <main style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px' }}>
        <CalendarSelector onDateSelect={setSelectedDate} />
      </div>

      <div style={{ flex: 2, border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
        {selectedDate ? (
          <>
            <SeatSelector onSeatSelect={setSelectedSeat} />
            <button
              onClick={handleReservation}
              disabled={!selectedSeat}
              style={{
                marginTop: '2rem',
                padding: '1rem 2rem',
                borderRadius: '8px',
                backgroundColor: selectedSeat ? '#0070f3' : '#aaa',
                color: '#fff',
                border: 'none',
                cursor: selectedSeat ? 'pointer' : 'not-allowed',
              }}
            >
              予約する
            </button>
          </>
        ) : (
          <p>まずは日付を選んでください</p>
        )}
      </div>
    </main>
  );
}
