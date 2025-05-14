import { useEffect, useState } from 'react';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('http://localhost:8000/api/events');
    const data = await res.json();
    setEvents(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, date }),
    });
    setTitle('');
    setDate('');
    fetchEvents();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📅 カレンダーイベント</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="予定タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button type="submit">追加</button>
      </form>

      <ul>
        {events.map(e => (
          <li key={e.id}>
            <strong>{e.date}</strong>: {e.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
