import { useEffect, useState } from 'react';
import styles from './Calendar.module.css';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showModal, setShowModal] = useState(false);

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
    setShowModal(false);
    fetchEvents();
  };

  // 月表示用のカレンダーグリッド生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={styles.calendarContainer}>
      {/* ヘッダー部分 */}
      <header className={styles.calendarHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.menuBtn}>☰</button>
          <div className={styles.calendarIcon}>📅</div>
          <h1 className={styles.calendarTitle}>カレンダー</h1>
        </div>
        
        <div className={styles.headerCenter}>
          <button className={styles.navBtn} onClick={() => navigateMonth(-1)}>‹</button>
          <button className={styles.navBtn} onClick={() => navigateMonth(1)}>›</button>
          <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>
            今日
          </button>
          <h2 className={styles.currentMonth}>{formatDate(currentDate)}</h2>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.viewSwitcher}>
            <button 
              className={`${styles.viewBtn} ${view === 'day' ? styles.active : ''}`}
              onClick={() => setView('day')}
            >
              日
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
              onClick={() => setView('week')}
            >
              週
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
              onClick={() => setView('month')}
            >
              月
            </button>
          </div>
          <button className={styles.settingsBtn}>⚙</button>
        </div>
      </header>

      <div className={styles.calendarBody}>
        {/* サイドバー */}
        <aside className={styles.sidebar}>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span className={styles.plusIcon}>+</span>
            作成
          </button>
          
          <div className={styles.miniCalendar}>
            <div className={styles.miniCalendarHeader}>
              <button onClick={() => navigateMonth(-1)}>‹</button>
              <span>{formatDate(currentDate)}</span>
              <button onClick={() => navigateMonth(1)}>›</button>
            </div>
          </div>

          <div className={styles.myCalendars}>
            <h3>マイカレンダー</h3>
            <div className={styles.calendarItem}>
              <input type="checkbox" defaultChecked />
              <span className={styles.calendarColor} style={{backgroundColor: '#1976d2'}}></span>
              <span>個人</span>
            </div>
            <div className={styles.calendarItem}>
              <input type="checkbox" defaultChecked />
              <span className={styles.calendarColor} style={{backgroundColor: '#d32f2f'}}></span>
              <span>仕事</span>
            </div>
          </div>
        </aside>

        {/* メインカレンダー表示 */}
        <main className={styles.calendarMain}>
          {view === 'month' && (
            <div className={styles.monthView}>
              {/* 曜日ヘッダー */}
              <div className={styles.weekdays}>
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className={styles.weekday}>{day}</div>
                ))}
              </div>
              
              {/* カレンダーグリッド */}
              <div className={styles.calendarGrid}>
                {calendarDays.map((day, index) => (
                  <div 
                    key={index} 
                    className={`${styles.calendarDay} ${!isCurrentMonth(day) ? styles.otherMonth : ''} ${isToday(day) ? styles.today : ''}`}
                  >
                    <div className={styles.dayNumber}>{day.getDate()}</div>
                    <div className={styles.dayEvents}>
                      {events
                        .filter(event => event.date === day.toISOString().split('T')[0])
                        .map(event => (
                          <div key={event.id} className={styles.eventItem}>
                            {event.title}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className={styles.weekView}>
              <div className={styles.timeSlots}>
                {Array.from({length: 24}, (_, i) => (
                  <div key={i} className={styles.timeSlot}>
                    <span className={styles.timeLabel}>{i}:00</span>
                    <div className={styles.timeContent}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className={styles.dayView}>
              <div className={styles.dayTimeSlots}>
                {Array.from({length: 24}, (_, i) => (
                  <div key={i} className={styles.dayTimeSlot}>
                    <span className={styles.timeLabel}>{i}:00</span>
                    <div className={styles.timeContent}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* イベント作成フォーム（モーダル） */}
      {showModal && (
        <div className="modal">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>新しいイベント</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.eventForm}>
              <input
                type="text"
                placeholder="タイトルを追加"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={styles.titleInput}
              />
              <div className={styles.formRow}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={styles.dateInput}
                />
                <input
                  type="time"
                  className={styles.timeInput}
                />
              </div>
              <textarea
                placeholder="説明を追加"
                className={styles.descriptionInput}
              ></textarea>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  キャンセル
                </button>
                <button type="submit" className={styles.saveBtn}>保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
