import { useEffect, useState } from 'react';
import styles from './Calendar.module.css';

const API_BASE = 'http://localhost:8000/api';

export default function Calendar() {
  // 状態管理
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    category_id: 1,
    status: 'confirmed'
  });

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [currentDate, view]);

  // 時間フォーマット関数
  const formatDateTimeForAPI = (dateTimeLocal) => {
    if (!dateTimeLocal) return '';
    
    // datetime-localの値は "2025-06-16T10:00" 形式（ローカル時間）
    // これをUTC時間に変換して "2025-06-16T01:00:00" 形式で送信
    if (dateTimeLocal.length === 16) {
      const localDate = new Date(dateTimeLocal + ':00');
      return localDate.toISOString().slice(0, 19);
    }
    return dateTimeLocal;
  };

  const formatDateTimeForInput = (isoDateTime) => {
    if (!isoDateTime) return '';
    
    // ISO形式 "2025-06-16T01:00:00"（UTC）をローカル時間 "2025-06-16T10:00" に変換
    const utcDate = new Date(isoDateTime);
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    const hours = String(utcDate.getHours()).padStart(2, '0');
    const minutes = String(utcDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // API呼び出し関数
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const response = await fetch(
        `${API_BASE}/events?start=${startDate}&end=${endDate}`
      );
      const data = await response.json();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTimeSlots = async (date) => {
    try {
      const response = await fetch(`${API_BASE}/timeslots?date=${date}`);
      const data = await response.json();
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const checkAvailability = async (startTime, endTime, excludeId = 0) => {
    try {
      let url = `${API_BASE}/availability?start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}`;
      if (excludeId > 0) {
        url += `&exclude=${excludeId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return false;
    }
  };

  // イベント操作
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 送信用データの準備
      const eventData = {
        ...formData,
        start_time: formData.all_day 
          ? formData.start_time 
          : formatDateTimeForAPI(formData.start_time),
        end_time: formData.all_day 
          ? formData.end_time 
          : formatDateTimeForAPI(formData.end_time)
      };

      console.log('Sending event data:', eventData); // デバッグ用

      // 時間の重複チェック（終日でない場合のみ）
      if (!formData.all_day) {
        const excludeId = selectedEvent ? selectedEvent.id : 0;
        const available = await checkAvailability(
          eventData.start_time, 
          eventData.end_time, 
          excludeId
        );
        
        if (!available) {
          alert('選択した時間帯は既に予約されています。');
          setLoading(false);
          return;
        }
      }

      const url = selectedEvent 
        ? `${API_BASE}/events/${selectedEvent.id}`
        : `${API_BASE}/events`;
      
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        resetForm();
        setShowModal(false);
        fetchEvents();
      } else {
        const error = await response.text();
        alert(`エラー: ${error}`);
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('イベントの保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('このイベントを削除しますか？')) return;

    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowModal(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // ユーティリティ関数
  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setDate(date.getDate() - date.getDay());
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
    }
    return date.toISOString().split('T')[0];
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1, 0);
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else if (view === 'week') {
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const formatTime = (dateTimeString) => {
    // UTC時間をローカル時間として正しく表示
    const utcDate = new Date(dateTimeString);
    return utcDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      all_day: false,
      category_id: 1,
      status: 'confirmed'
    });
    setSelectedEvent(null);
    setTimeSlots([]);
  };

  const openEventModal = (event = null, date = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        start_time: formatDateTimeForInput(event.start_time),
        end_time: formatDateTimeForInput(event.end_time),
        all_day: event.all_day,
        category_id: event.category_id,
        status: event.status
      });
    } else {
      resetForm();
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          start_time: `${dateStr}T09:00`,
          end_time: `${dateStr}T10:00`
        }));
        fetchTimeSlots(dateStr);
      }
    }
    setShowModal(true);
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      // UTC時間をローカル時間に変換してから日付を比較
      const utcDate = new Date(event.start_time);
      const localDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // JSTに変換
      const eventDateStr = localDate.toISOString().split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#1976d2';
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={styles.calendarContainer}>
      {/* ヘッダー */}
      <header className={styles.calendarHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.menuBtn}>☰</button>
          <div className={styles.calendarIcon}>📅</div>
          <h1 className={styles.calendarTitle}>予約カレンダー</h1>
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
          <button className={styles.createBtn} onClick={() => openEventModal()}>
            <span className={styles.plusIcon}>+</span>
            予約作成
          </button>
          
          <div className={styles.miniCalendar}>
            <div className={styles.miniCalendarHeader}>
              <button onClick={() => navigateMonth(-1)}>‹</button>
              <span>{formatDate(currentDate)}</span>
              <button onClick={() => navigateMonth(1)}>›</button>
            </div>
          </div>

          <div className={styles.myCalendars}>
            <h3>カテゴリー</h3>
            {categories.map(category => (
              <div key={category.id} className={styles.calendarItem}>
                <input type="checkbox" defaultChecked />
                <span 
                  className={styles.calendarColor} 
                  style={{backgroundColor: category.color}}
                ></span>
                <span>{category.name}</span>
              </div>
            ))}
          </div>

          {/* 利用可能時間スロット表示 */}
          {timeSlots.length > 0 && (
            <div className={styles.timeSlotsList}>
              <h3>利用可能時間</h3>
              <div className={styles.slotsContainer}>
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`${styles.timeSlot} ${!slot.available ? styles.unavailable : ''}`}
                    disabled={!slot.available}
                    onClick={() => {
                      if (slot.available) {
                        // 時間スロットはローカル時間として表示されているので、
                        // そのまま使用（formatDateTimeForAPIでUTCに変換される）
                        setFormData(prev => ({
                          ...prev,
                          start_time: `${slot.date}T${slot.start_time}`,
                          end_time: `${slot.date}T${slot.end_time}`
                        }));
                      }
                    }}
                  >
                    {slot.start_time} - {slot.end_time}
                    {!slot.available && <span className={styles.unavailableLabel}>予約済</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* メインカレンダー表示 */}
        <main className={styles.calendarMain}>
          {loading && <div className={styles.loading}>読み込み中...</div>}
          
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
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  return (
                    <div 
                      key={index} 
                      className={`${styles.calendarDay} ${!isCurrentMonth(day) ? styles.otherMonth : ''} ${isToday(day) ? styles.today : ''}`}
                      onClick={() => openEventModal(null, day)}
                    >
                      <div className={styles.dayNumber}>{day.getDate()}</div>
                      <div className={styles.dayEvents}>
                        {dayEvents.map(event => (
                          <div 
                            key={event.id} 
                            className={styles.eventItem}
                            style={{backgroundColor: getCategoryColor(event.category_id)}}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEventModal(event);
                            }}
                          >
                            <div className={styles.eventTime}>
                              {event.all_day ? '終日' : formatTime(event.start_time)}
                            </div>
                            <div className={styles.eventTitle}>{event.title}</div>
                            {event.status === 'pending' && (
                              <div className={styles.eventStatus}>保留中</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            <WeekView 
              currentDate={currentDate}
              events={events}
              onEventClick={openEventModal}
              getCategoryColor={getCategoryColor}
              styles={styles}
            />
          )}

          {view === 'day' && (
            <DayView 
              currentDate={currentDate}
              events={events}
              onEventClick={openEventModal}
              getCategoryColor={getCategoryColor}
              styles={styles}
            />
          )}
        </main>
      </div>

      {/* イベント作成・編集モーダル */}
      {showModal && (
        <div className="modal">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{selectedEvent ? 'イベント編集' : '新しい予約'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.eventForm}>
              <input
                type="text"
                placeholder="タイトルを入力"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className={styles.titleInput}
              />
              
              <div className={styles.formRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({...formData, all_day: e.target.checked})}
                  />
                  終日
                </label>
              </div>

              {!formData.all_day && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>開始時刻</label>
                      <input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        required
                        className={styles.dateInput}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>終了時刻</label>
                      <input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        required
                        className={styles.dateInput}
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.all_day && (
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>日付</label>
                    <input
                      type="date"
                      value={formData.start_time.split('T')[0] || ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        setFormData({
                          ...formData, 
                          start_time: `${date}T00:00`,
                          end_time: `${date}T23:59`
                        });
                      }}
                      required
                      className={styles.dateInput}
                    />
                  </div>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>カテゴリー</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                    className={styles.selectInput}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>ステータス</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className={styles.selectInput}
                  >
                    <option value="confirmed">確定</option>
                    <option value="pending">保留中</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="説明・備考"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={styles.descriptionInput}
              />

              <div className={styles.formActions}>
                {selectedEvent && (
                  <button 
                    type="button" 
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    削除
                  </button>
                )}
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setShowModal(false)}
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 週表示コンポーネント
function WeekView({ currentDate, events, onEventClick, getCategoryColor, styles }) {
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const weekDays = Array.from({length: 7}, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const hours = Array.from({length: 24}, (_, i) => i);

  return (
    <div className={styles.weekView}>
      <div className={styles.weekHeader}>
        <div></div>
        {weekDays.map((day, index) => (
          <div key={index} className={styles.weekDayHeader}>
            <div className={styles.weekDayName}>
              {day.toLocaleDateString('ja-JP', { weekday: 'short' })}
            </div>
            <div className={styles.weekDayDate}>{day.getDate()}</div>
          </div>
        ))}
      </div>
      
      <div className={styles.weekGrid}>
        <div className={styles.timeColumn}>
          {hours.map(hour => (
            <div key={hour} className={styles.timeSlot}>
              <span className={styles.timeLabel}>{hour}:00</span>
            </div>
          ))}
        </div>
        
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className={styles.dayColumn}>
            {hours.map(hour => (
              <div key={hour} className={styles.hourSlot}>
                {events
                  .filter(event => {
                    // UTC時間をローカル時間に変換してから比較
                    const utcDate = new Date(event.start_time);
                    const localDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // JSTに変換
                    return localDate.toDateString() === day.toDateString() &&
                           localDate.getHours() === hour;
                  })
                  .map(event => (
                    <div
                      key={event.id}
                      className={styles.weekEventItem}
                      style={{backgroundColor: getCategoryColor(event.category_id)}}
                      onClick={() => onEventClick(event)}
                    >
                      <div className={styles.eventTitle}>{event.title}</div>
                      <div className={styles.eventTime}>
                        {new Date(event.start_time).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Tokyo'
                        })}
                      </div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 日表示コンポーネント
function DayView({ currentDate, events, onEventClick, getCategoryColor, styles }) {
  const hours = Array.from({length: 24}, (_, i) => i);
  const dayEvents = events.filter(event => {
    // UTC時間をローカル時間に変換してから比較
    const utcDate = new Date(event.start_time);
    const localDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // JSTに変換
    return localDate.toDateString() === currentDate.toDateString();
  });

  return (
    <div className={styles.dayView}>
      <div className={styles.dayHeader}>
        <h3>{currentDate.toLocaleDateString('ja-JP', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h3>
      </div>
      
      <div className={styles.dayTimeSlots}>
        {hours.map(hour => (
          <div key={hour} className={styles.dayTimeSlot}>
            <span className={styles.timeLabel}>{hour}:00</span>
            <div className={styles.timeContent}>
              {dayEvents
                .filter(event => {
                  // UTC時間をローカル時間に変換してから時間を比較
                  const utcDate = new Date(event.start_time);
                  const localDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // JSTに変換
                  return localDate.getHours() === hour;
                })
                .map(event => (
                  <div
                    key={event.id}
                    className={styles.dayEventItem}
                    style={{backgroundColor: getCategoryColor(event.category_id)}}
                    onClick={() => onEventClick(event)}
                  >
                    <div className={styles.eventTitle}>{event.title}</div>
                    <div className={styles.eventTime}>
                      {new Date(event.start_time).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tokyo'
                      })} - {new Date(event.end_time).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tokyo'
                      })}
                    </div>
                    {event.description && (
                      <div className={styles.eventDescription}>{event.description}</div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
