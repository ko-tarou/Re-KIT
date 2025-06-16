package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type Event struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	AllDay      bool   `json:"all_day"`
	CategoryID  int    `json:"category_id"`
	Color       string `json:"color"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type Category struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Color  string `json:"color"`
	UserID int    `json:"user_id"`
}

type TimeSlot struct {
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Available bool   `json:"available"`
}

func main() {
	db, err := sql.Open("sqlite", "calendar.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// データベースの初期化（古いテーブルを削除して新しく作成）
	initializeDatabase(db)

	http.HandleFunc("/api/events", handleEvents(db))
	http.HandleFunc("/api/events/", handleEventByID(db))
	http.HandleFunc("/api/categories", handleCategories(db))
	http.HandleFunc("/api/timeslots", handleTimeSlots(db))
	http.HandleFunc("/api/availability", handleAvailability(db))

	log.Println("🚀 Server starting on :8000...")
	log.Fatal(http.ListenAndServe(":8000", nil))
}

func initializeDatabase(db *sql.DB) {
	log.Println("Initializing database...")

	// 既存のテーブルを削除（開発環境のため）
	_, err := db.Exec("DROP TABLE IF EXISTS events")
	if err != nil {
		log.Printf("Warning: Could not drop events table: %v", err)
	}

	_, err = db.Exec("DROP TABLE IF EXISTS categories")
	if err != nil {
		log.Printf("Warning: Could not drop categories table: %v", err)
	}

	_, err = db.Exec("DROP TABLE IF EXISTS business_hours")
	if err != nil {
		log.Printf("Warning: Could not drop business_hours table: %v", err)
	}

	// 新しいテーブルを作成
	createTables(db)
	log.Println("Database initialized successfully!")
}

func createTables(db *sql.DB) {
	// カテゴリーテーブル（外部キー制約のため先に作成）
	_, err := db.Exec(`CREATE TABLE categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		color TEXT NOT NULL,
		user_id INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatal("Failed to create categories table:", err)
	}

	// イベントテーブル（完全版）
	_, err = db.Exec(`CREATE TABLE events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		start_time DATETIME NOT NULL,
		end_time DATETIME NOT NULL,
		all_day BOOLEAN DEFAULT FALSE,
		category_id INTEGER DEFAULT 1,
		color TEXT DEFAULT '#1976d2',
		status TEXT DEFAULT 'confirmed',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (category_id) REFERENCES categories(id)
	)`)
	if err != nil {
		log.Fatal("Failed to create events table:", err)
	}

	// 営業時間テーブル
	_, err = db.Exec(`CREATE TABLE business_hours (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		day_of_week INTEGER NOT NULL,
		start_time TEXT NOT NULL,
		end_time TEXT NOT NULL,
		is_available BOOLEAN DEFAULT TRUE
	)`)
	if err != nil {
		log.Fatal("Failed to create business_hours table:", err)
	}

	// デフォルトデータの挿入
	insertDefaultData(db)
}

func insertDefaultData(db *sql.DB) {
	// デフォルトカテゴリーの挿入
	categories := []struct {
		id    int
		name  string
		color string
	}{
		{1, "個人", "#1976d2"},
		{2, "仕事", "#d32f2f"},
		{3, "予約", "#388e3c"},
		{4, "その他", "#f57c00"},
	}

	for _, cat := range categories {
		_, err := db.Exec("INSERT INTO categories (id, name, color) VALUES (?, ?, ?)",
			cat.id, cat.name, cat.color)
		if err != nil {
			log.Printf("Warning: Could not insert category %s: %v", cat.name, err)
		}
	}

	// デフォルト営業時間の挿入（月曜日=1, 火曜日=2, ..., 金曜日=5）
	businessHours := []struct {
		dayOfWeek int
		startTime string
		endTime   string
	}{
		{1, "09:00", "18:00"}, // 月曜日
		{2, "09:00", "18:00"}, // 火曜日
		{3, "09:00", "18:00"}, // 水曜日
		{4, "09:00", "18:00"}, // 木曜日
		{5, "09:00", "18:00"}, // 金曜日
	}

	for _, bh := range businessHours {
		_, err := db.Exec("INSERT INTO business_hours (day_of_week, start_time, end_time) VALUES (?, ?, ?)",
			bh.dayOfWeek, bh.startTime, bh.endTime)
		if err != nil {
			log.Printf("Warning: Could not insert business hours: %v", err)
		}
	}

	log.Println("Default data inserted successfully!")
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func handleEvents(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		switch r.Method {
		case "GET":
			getEvents(db, w, r)
		case "POST":
			createEvent(db, w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func handleEventByID(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/api/events/")
		id, err := strconv.Atoi(path)
		if err != nil {
			http.Error(w, "Invalid event ID", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case "GET":
			getEventByID(db, w, id)
		case "PUT":
			updateEvent(db, w, r, id)
		case "DELETE":
			deleteEvent(db, w, id)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func getEvents(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start")
	endDate := r.URL.Query().Get("end")

	query := `SELECT e.id, e.title, COALESCE(e.description, '') as description, 
			  e.start_time, e.end_time, e.all_day, e.category_id, 
			  COALESCE(c.color, e.color) as color, e.status, 
			  e.created_at, e.updated_at 
			  FROM events e 
			  LEFT JOIN categories c ON e.category_id = c.id
			  WHERE e.status != 'cancelled'`
	
	args := []interface{}{}
	
	if startDate != "" && endDate != "" {
		query += " AND e.start_time >= ? AND e.end_time <= ?"
		args = append(args, startDate, endDate)
	}
	
	query += " ORDER BY e.start_time"

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Printf("Error querying events: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.StartTime, &e.EndTime,
			&e.AllDay, &e.CategoryID, &e.Color, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
			log.Printf("Error scanning event: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		events = append(events, e)
	}

	log.Printf("Retrieved %d events", len(events))
	json.NewEncoder(w).Encode(events)
}

func createEvent(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	var e Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		log.Printf("Error decoding event: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Creating event: %+v", e)

	// デフォルト値の設定
	if e.Status == "" {
		e.Status = "confirmed"
	}
	if e.Color == "" {
		e.Color = "#1976d2"
	}
	if e.CategoryID == 0 {
		e.CategoryID = 1
	}
	if e.Description == "" {
		e.Description = ""
	}

	// 終日イベントの場合は時間重複チェックをスキップ
	if !e.AllDay {
		// 時間フォーマットの正規化
		startTime, err := normalizeDateTime(e.StartTime)
		if err != nil {
			log.Printf("Error parsing start time: %v", err)
			http.Error(w, "Invalid start time format", http.StatusBadRequest)
			return
		}
		
		endTime, err := normalizeDateTime(e.EndTime)
		if err != nil {
			log.Printf("Error parsing end time: %v", err)
			http.Error(w, "Invalid end time format", http.StatusBadRequest)
			return
		}

		// 時間の重複チェック
		if isTimeSlotOccupied(db, startTime, endTime, 0) {
			log.Printf("Time slot occupied: %s - %s", startTime, endTime)
			http.Error(w, "Time slot is already occupied", http.StatusConflict)
			return
		}

		e.StartTime = startTime
		e.EndTime = endTime
	} else {
		// 終日イベントの場合の時間設定
		date := strings.Split(e.StartTime, "T")[0]
		e.StartTime = date + "T00:00:00"
		e.EndTime = date + "T23:59:59"
	}

	result, err := db.Exec(`INSERT INTO events 
		(title, description, start_time, end_time, all_day, category_id, color, status, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
		e.Title, e.Description, e.StartTime, e.EndTime, e.AllDay, e.CategoryID, e.Color, e.Status)
	
	if err != nil {
		log.Printf("Error inserting event: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	e.ID = int(id)

	log.Printf("Event created successfully: ID=%d, Title=%s, Start=%s, End=%s", e.ID, e.Title, e.StartTime, e.EndTime)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

func updateEvent(db *sql.DB, w http.ResponseWriter, r *http.Request, id int) {
	var e Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 終日イベントでない場合の時間重複チェック
	if !e.AllDay {
		startTime, err := normalizeDateTime(e.StartTime)
		if err != nil {
			http.Error(w, "Invalid start time format", http.StatusBadRequest)
			return
		}
		
		endTime, err := normalizeDateTime(e.EndTime)
		if err != nil {
			http.Error(w, "Invalid end time format", http.StatusBadRequest)
			return
		}

		// 自分以外との重複チェック
		if isTimeSlotOccupied(db, startTime, endTime, id) {
			http.Error(w, "Time slot is already occupied", http.StatusConflict)
			return
		}

		e.StartTime = startTime
		e.EndTime = endTime
	} else {
		date := strings.Split(e.StartTime, "T")[0]
		e.StartTime = date + "T00:00:00"
		e.EndTime = date + "T23:59:59"
	}

	_, err := db.Exec(`UPDATE events SET 
		title=?, description=?, start_time=?, end_time=?, all_day=?, 
		category_id=?, color=?, status=?, updated_at=CURRENT_TIMESTAMP 
		WHERE id=?`,
		e.Title, e.Description, e.StartTime, e.EndTime, e.AllDay,
		e.CategoryID, e.Color, e.Status, id)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	e.ID = id
	json.NewEncoder(w).Encode(e)
}

func deleteEvent(db *sql.DB, w http.ResponseWriter, id int) {
	_, err := db.Exec("DELETE FROM events WHERE id=?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getEventByID(db *sql.DB, w http.ResponseWriter, id int) {
	var e Event
	err := db.QueryRow(`SELECT e.id, e.title, COALESCE(e.description, '') as description, 
		e.start_time, e.end_time, e.all_day, e.category_id, 
		COALESCE(c.color, e.color) as color, e.status, 
		e.created_at, e.updated_at 
		FROM events e 
		LEFT JOIN categories c ON e.category_id = c.id 
		WHERE e.id=?`, id).Scan(
		&e.ID, &e.Title, &e.Description, &e.StartTime, &e.EndTime,
		&e.AllDay, &e.CategoryID, &e.Color, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Event not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	json.NewEncoder(w).Encode(e)
}

func handleCategories(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		switch r.Method {
		case "GET":
			getCategories(db, w)
		case "POST":
			createCategory(db, w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func getCategories(db *sql.DB, w http.ResponseWriter) {
	rows, err := db.Query("SELECT id, name, color, user_id FROM categories ORDER BY name")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Color, &c.UserID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		categories = append(categories, c)
	}

	json.NewEncoder(w).Encode(categories)
}

func createCategory(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := db.Exec("INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)",
		c.Name, c.Color, c.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	c.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func handleTimeSlots(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == "GET" {
			getAvailableTimeSlots(db, w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func getAvailableTimeSlots(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		http.Error(w, "Date parameter is required", http.StatusBadRequest)
		return
	}

	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		http.Error(w, "Invalid date format", http.StatusBadRequest)
		return
	}

	dayOfWeek := int(t.Weekday())

	var startTime, endTime string
	err = db.QueryRow("SELECT start_time, end_time FROM business_hours WHERE day_of_week=? AND is_available=TRUE", 
		dayOfWeek).Scan(&startTime, &endTime)
	
	if err != nil {
		if err == sql.ErrNoRows {
			json.NewEncoder(w).Encode([]TimeSlot{})
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	timeSlots := generateTimeSlots(date, startTime, endTime, 30)

	for i := range timeSlots {
		slotStart := timeSlots[i].Date + "T" + timeSlots[i].StartTime + ":00"
		slotEnd := timeSlots[i].Date + "T" + timeSlots[i].EndTime + ":00"
		timeSlots[i].Available = !isTimeSlotOccupied(db, slotStart, slotEnd, 0)
	}

	json.NewEncoder(w).Encode(timeSlots)
}

func generateTimeSlots(date, startTime, endTime string, intervalMinutes int) []TimeSlot {
	var slots []TimeSlot
	
	start, _ := time.Parse("15:04", startTime)
	end, _ := time.Parse("15:04", endTime)
	
	current := start
	for current.Before(end) {
		next := current.Add(time.Duration(intervalMinutes) * time.Minute)
		if next.After(end) {
			break
		}
		
		slots = append(slots, TimeSlot{
			Date:      date,
			StartTime: current.Format("15:04"),
			EndTime:   next.Format("15:04"),
			Available: true,
		})
		
		current = next
	}
	
	return slots
}

// 修正された重複チェック関数
func isTimeSlotOccupied(db *sql.DB, startTime, endTime string, excludeID int) bool {
	// より正確な重複チェッククエリ
	query := `SELECT COUNT(*) FROM events WHERE 
		status = 'confirmed' AND
		NOT (end_time <= ? OR start_time >= ?)`
	
	args := []interface{}{startTime, endTime}
	
	if excludeID > 0 {
		query += " AND id != ?"
		args = append(args, excludeID)
	}
	
	var count int
	err := db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		log.Printf("Error checking time slot occupation: %v", err)
		return true // エラーの場合は安全側に倒す
	}
	
	log.Printf("Time slot check: %s - %s, Count: %d, Occupied: %t", startTime, endTime, count, count > 0)
	return count > 0
}

func handleAvailability(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == "GET" {
			checkAvailability(db, w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func checkAvailability(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	startTime := r.URL.Query().Get("start")
	endTime := r.URL.Query().Get("end")
	excludeIDStr := r.URL.Query().Get("exclude")
	
	if startTime == "" || endTime == "" {
		http.Error(w, "Start and end time parameters are required", http.StatusBadRequest)
		return
	}

	excludeID := 0
	if excludeIDStr != "" {
		if id, err := strconv.Atoi(excludeIDStr); err == nil {
			excludeID = id
		}
	}

	// 時間フォーマットの正規化
	normalizedStart, err := normalizeDateTime(startTime)
	if err != nil {
		http.Error(w, "Invalid start time format", http.StatusBadRequest)
		return
	}
	
	normalizedEnd, err := normalizeDateTime(endTime)
	if err != nil {
		http.Error(w, "Invalid end time format", http.StatusBadRequest)
		return
	}

	available := !isTimeSlotOccupied(db, normalizedStart, normalizedEnd, excludeID)
	
	response := map[string]bool{"available": available}
	json.NewEncoder(w).Encode(response)
}

// 修正された時間フォーマット正規化関数
func normalizeDateTime(dateTimeStr string) (string, error) {
	// 複数の形式をサポート
	formats := []string{
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
	}
	
	for _, format := range formats {
		if t, err := time.Parse(format, dateTimeStr); err == nil {
			return t.Format("2006-01-02T15:04:05"), nil
		}
	}
	
	return "", fmt.Errorf("unsupported time format: %s", dateTimeStr)
}
