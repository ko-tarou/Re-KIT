'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// カレンダーの日付生成用
function getMonthDates(year: number, month: number) {
  const dates: (number | null)[][] = [];
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  let current = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (current < 1 || current > lastDate) {
        week.push(null);
      } else {
        week.push(current);
      }
      current++;
    }
    dates.push(week);
    if (current > lastDate) break;
  }
  return dates;
}

export default function Home() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const dates = getMonthDates(year, month);
  const router = useRouter();

  // 日付クリックハンドラ
  const onDayClick = (date: number | null) => {
    if (date) {
      // YYYY-MM-DD
      const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      router.push(`/reserve/${formatted}`);
    }
  };

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          className="px-2 py-1 rounded hover:bg-gray-200"
          onClick={() =>
            month === 0 ? (setYear(year - 1), setMonth(11)) : setMonth(month - 1)
          }
        >
          {'<'}
        </button>
        <div className="font-semibold text-lg">
          {year}年 {month + 1}月
        </div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-200"
          onClick={() =>
            month === 11 ? (setYear(year + 1), setMonth(0)) : setMonth(month + 1)
          }
        >
          {'>'}
        </button>
      </div>
      <table className="w-full border text-center select-none">
        <thead>
          <tr className="bg-zinc-100">
            {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
              <th key={d} className="font-medium p-2 border-zinc-200 border">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((week, i) => (
            <tr key={i}>
              {week.map((date, j) => (
                <td
                  key={j}
                  className={`p-2 border-zinc-200 border h-14 cursor-pointer hover:bg-zinc-200 ${j === 0 ? 'text-red-500' : ''} ${j === 6 ? 'text-blue-500' : ''}`}
                  onClick={() => onDayClick(date)}
                >
                  {date ? date : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
