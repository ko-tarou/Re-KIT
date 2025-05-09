'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const ROWS = 12;
const COLS = ['A', 'B', 'C', 'D', 'E'];

// 初期ダミー予約済み席（例: "B2", "D7" など）
const INIT_RESERVED = ['A3', 'C5', 'D8', 'E10', 'B2', 'C2', 'E4'];

export default function ReserveSeat() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  // 選択済み座席
  const [selected, setSelected] = useState<string[]>([]);
  // 予約済み座席
  const [reserved, setReserved] = useState<string[]>(INIT_RESERVED);
  // 予約成功表示用
  const [success, setSuccess] = useState(false);

  const toggleSeat = (seatId: string) => {
    if (reserved.includes(seatId)) return; // クリック不可
    setSelected((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  // 予約ボタン押下時
  const handleReserve = () => {
    if (!selected.length) return;
    setReserved((prev) => [...prev, ...selected]);
    setSelected([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1600);
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <button
        onClick={() => router.push('/')}
        className="mb-3 px-3 py-1 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 font-semibold"
      >
        ← カレンダーに戻る
      </button>
      <h1 className="font-bold text-lg mb-2">{date} 予約</h1>
      <table className="border w-full text-center mb-4">
        <thead>
          <tr>
            <th className="px-1 py-2">行</th>
            {COLS.map((col) => (
              <th key={col} className="px-4">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              <td className="px-2 py-2 font-semibold">{rowIdx + 1}</td>
              {COLS.map((col) => {
                const seatId = `${col}${rowIdx + 1}`;
                const isSelected = selected.includes(seatId);
                const isReserved = reserved.includes(seatId);
                return (
                  <td key={seatId}>
                    <button
                      className={`w-10 h-10 rounded border m-1 transition-colors duration-150
                        ${isReserved
                          ? 'bg-gray-400 text-white cursor-not-allowed border-gray-700'
                          : isSelected
                          ? 'bg-blue-500 text-white border-blue-700'
                          : 'bg-zinc-100 hover:bg-blue-100'}
                      `}
                      disabled={isReserved}
                      onClick={() => toggleSeat(seatId)}
                      title={isReserved ? '予約済み' : '空席'}
                    >
                      {col}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-4">選択中: {selected.length === 0 ? 'なし' : selected.join(', ')}</div>
      <button
        className={`bg-green-600 px-6 py-2 text-white rounded disabled:bg-gray-400`}
        onClick={handleReserve}
        disabled={!selected.length}
      >
        予約する
      </button>
      {success && (
        <div className="mt-4 text-green-700 font-semibold">予約が完了しました</div>
      )}
      <div className="mt-4 text-xs text-gray-500">※グレー：予約済み、青：選択中、白：空席</div>
    </main>
  );
}
