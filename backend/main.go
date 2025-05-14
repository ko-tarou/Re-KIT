package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "modernc.org/sqlite"
)

type Event struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Date  string `json:"date"`
}

func main() {
	db, err := sql.Open("sqlite", "calendar.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// テーブル作成（初回だけ）
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT,
		date TEXT
	)`)
	if err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/api/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodGet {
			rows, err := db.Query("SELECT id, title, date FROM events")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			var events []Event
			for rows.Next() {
				var e Event
				if err := rows.Scan(&e.ID, &e.Title, &e.Date); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				events = append(events, e)
			}
			json.NewEncoder(w).Encode(events)
		} else if r.Method == http.MethodPost {
			var e Event
			if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			_, err := db.Exec("INSERT INTO events (title, date) VALUES (?, ?)", e.Title, e.Date)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
		}
	})


	log.Println("Listening on :8000...")
	log.Fatal(http.ListenAndServe(":8000", nil))
}
