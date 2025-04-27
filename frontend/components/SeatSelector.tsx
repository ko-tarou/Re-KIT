// components/SeatSelector.tsx
import React, { useState } from 'react';

type Seat = {
  id: number;
  name: string;
};

const mockSeats: Seat[] = [
  { id: 1, name: 'A1' },
  { id: 2, name: 'A2' },
  { id: 3, name: 'A3' },
  { id: 4, name: 'B1' },
  { id: 5, name: 'B2' },
  { id: 6, name: 'B3' },
];

type Props = {
  onSeatSelect: (seat: Seat) => void;
};

const SeatSelector: React.FC<Props> = ({ onSeatSelect }) => {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  const handleSelect = (seat: Seat) => {
    setSelectedSeat(seat);
    onSeatSelect(seat);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>座席を選択</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
        {mockSeats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleSelect(seat)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: selectedSeat?.id === seat.id ? '#4CAF50' : '#f0f0f0',
              border: '1px solid #ccc',
              cursor: 'pointer',
              minWidth: '60px',
            }}
          >
            {seat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeatSelector;
