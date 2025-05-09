"use client"
import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Check, Info } from "lucide-react"

// 座席の行と列の定義
const ROWS = 12
const COLS = ["A", "B", "C", "D", "E"]

// 初期ダミー予約済み席（例: "B2", "D7" など）
const INIT_RESERVED = ["A3", "C5", "D8", "E10", "B2", "C2", "E4"]

// 座席の型定義
type SeatId = string

export default function ReserveSeat() {
  const params = useParams()
  const router = useRouter()
  const date = params?.date as string

  // 選択済み座席
  const [selected, setSelected] = useState<SeatId[]>([])
  // 予約済み座席
  const [reserved, setReserved] = useState<SeatId[]>(INIT_RESERVED)
  // 予約成功表示用
  const [success, setSuccess] = useState(false)
  // 予約処理中
  const [loading, setLoading] = useState(false)

  // 座席選択トグル
  const toggleSeat = useCallback(
    (seatId: SeatId) => {
      if (reserved.includes(seatId)) return // 予約済みはクリック不可

      setSelected((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
    },
    [reserved],
  )

  // 予約ボタン押下時
  const handleReserve = useCallback(() => {
    if (!selected.length) return

    setLoading(true)

    // 実際のAPIリクエストをシミュレート
    setTimeout(() => {
      setReserved((prev) => [...prev, ...selected])
      setSelected([])
      setSuccess(true)
      setLoading(false)

      // 成功メッセージを一定時間後に非表示
      setTimeout(() => setSuccess(false), 3000)
    }, 800)
  }, [selected])

  // カレンダーに戻る
  const goBackToCalendar = useCallback(() => {
    router.push("/")
  }, [router])

  // 座席の状態を取得
  const getSeatStatus = useCallback(
    (seatId: SeatId) => {
      if (reserved.includes(seatId)) return "reserved"
      if (selected.includes(seatId)) return "selected"
      return "available"
    },
    [reserved, selected],
  )

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={goBackToCalendar}
        className="mb-6 px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-medium flex items-center gap-2 transition-colors"
        aria-label="カレンダーに戻る"
      >
        <ChevronLeft className="w-4 h-4" />
        カレンダーに戻る
      </button>

      <h1 className="font-bold text-2xl mb-6">{date} の座席予約</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4 mb-6">
        <div className="overflow-x-auto">
          <table className="border-collapse w-full text-center mb-4">
            <thead>
              <tr>
                <th className="px-2 py-3 font-medium">行</th>
                {COLS.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="px-2 py-3 font-semibold">{rowIdx + 1}</td>
                  {COLS.map((col) => {
                    const seatId = `${col}${rowIdx + 1}`
                    const status = getSeatStatus(seatId)

                    return (
                      <td key={seatId}>
                        <button
                          className={`w-12 h-12 rounded-lg border m-1 transition-all duration-150 flex items-center justify-center
                            ${
                              status === "reserved"
                                ? "seat-reserved"
                                : status === "selected"
                                  ? "seat-selected"
                                  : "seat-available"
                            }
                          `}
                          disabled={status === "reserved" || loading}
                          onClick={() => toggleSeat(seatId)}
                          aria-label={`座席 ${seatId} ${status === "reserved" ? "予約済み" : status === "selected" ? "選択中" : "空席"}`}
                        >
                          {seatId}
                          {status === "selected" && <Check className="w-4 h-4 ml-1" />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-sm seat-available"></div>
          <span>空席</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-sm seat-selected"></div>
          <span>選択中</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-sm seat-reserved"></div>
          <span>予約済み</span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4 mb-6">
        <h2 className="font-semibold mb-2">選択中の座席</h2>
        <div className="mb-4">
          {selected.length === 0 ? (
            <div className="text-zinc-500 dark:text-zinc-400">座席を選択してください</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selected.map((seat) => (
                <span
                  key={seat}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {seat}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          className={`bg-blue-600 dark:bg-blue-700 px-6 py-3 text-white rounded-lg font-medium 
            disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
            hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors
            flex items-center justify-center gap-2 w-full sm:w-auto
          `}
          onClick={handleReserve}
          disabled={!selected.length || loading}
        >
          {loading ? "処理中..." : "予約する"}
          {!loading && <Check className="w-5 h-5" />}
        </button>
      </div>

      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-medium">予約が完了しました</span>
        </div>
      )}

      <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        <Info className="w-4 h-4" />
        <span>座席は複数選択できます。予約後はキャンセルできませんのでご注意ください。</span>
      </div>
    </div>
  )
}
