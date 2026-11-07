use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub static DB_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Highlight {
    pub id: String,
    pub paragraph_id: String,
    pub book_id: Option<String>,
    pub chapter_title: Option<String>,
    pub start_offset: usize,
    pub end_offset: usize,
    pub color: String, // yellow, blue, red, green
    pub selected_text: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub paragraph_id: String,
    pub highlight_id: Option<String>,
    pub book_id: Option<String>,
    pub chapter_title: Option<String>,
    pub note_text: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Favorite {
    pub id: String,
    pub item_type: String, // 'paragraph' | 'note'
    pub target_id: String,
    pub title: Option<String>,
    pub preview_text: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadingProgress {
    pub last_paragraph_id: String,
    pub last_book_id: String,
    pub last_chapter_id: String,
    pub scroll_percentage: f64,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadingStats {
    pub date: String,
    pub words_read: i64,
    pub paragraphs_read: i64,
    pub minutes_spent: i64,
}

pub fn init_db(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let db_path = match app_handle.path().app_data_dir() {
        Ok(dir) => {
            let _ = fs::create_dir_all(&dir);
            dir.join("organon.db")
        }
        Err(_) => {
            let fallback = PathBuf::from("data/organon.db");
            if let Some(parent) = fallback.parent() {
                let _ = fs::create_dir_all(parent);
            }
            fallback
        }
    };

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS reading_progress (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_paragraph_id TEXT NOT NULL,
            last_book_id TEXT NOT NULL,
            last_chapter_id TEXT NOT NULL,
            scroll_percentage REAL NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            paragraph_id TEXT NOT NULL,
            book_id TEXT,
            chapter_title TEXT,
            start_offset INTEGER NOT NULL,
            end_offset INTEGER NOT NULL,
            color TEXT NOT NULL,
            selected_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            paragraph_id TEXT NOT NULL,
            highlight_id TEXT,
            book_id TEXT,
            chapter_title TEXT,
            note_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            item_type TEXT NOT NULL,
            target_id TEXT NOT NULL UNIQUE,
            title TEXT,
            preview_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reading_stats (
            date TEXT PRIMARY KEY,
            words_read INTEGER DEFAULT 0,
            paragraphs_read INTEGER DEFAULT 0,
            minutes_spent INTEGER DEFAULT 0
        );
        ",
    )
    .map_err(|e| e.to_string())?;

    if let Ok(mut lock) = DB_PATH.lock() {
        *lock = Some(db_path);
    }

    Ok(())
}

pub fn get_conn() -> Result<Connection, String> {
    let path = {
        let lock = DB_PATH.lock().map_err(|e| e.to_string())?;
        lock.clone().unwrap_or_else(|| PathBuf::from("data/organon.db"))
    };

    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    Connection::open(&path).map_err(|e| e.to_string())
}

pub fn fetch_highlights() -> Result<Vec<Highlight>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, paragraph_id, book_id, chapter_title, start_offset, end_offset, color, selected_text, created_at FROM highlights ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Highlight {
                id: row.get(0)?,
                paragraph_id: row.get(1)?,
                book_id: row.get(2)?,
                chapter_title: row.get(3)?,
                start_offset: row.get::<_, i64>(4)? as usize,
                end_offset: row.get::<_, i64>(5)? as usize,
                color: row.get(6)?,
                selected_text: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for item in iter {
        if let Ok(h) = item {
            res.push(h);
        }
    }
    Ok(res)
}

pub fn insert_highlight(h: Highlight) -> Result<Highlight, String> {
    let conn = get_conn()?;
    conn.execute(
        "INSERT INTO highlights (id, paragraph_id, book_id, chapter_title, start_offset, end_offset, color, selected_text, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, COALESCE(?9, CURRENT_TIMESTAMP))
         ON CONFLICT(id) DO UPDATE SET
            color = excluded.color,
            start_offset = excluded.start_offset,
            end_offset = excluded.end_offset,
            selected_text = excluded.selected_text",
        params![
            h.id,
            h.paragraph_id,
            h.book_id,
            h.chapter_title,
            h.start_offset as i64,
            h.end_offset as i64,
            h.color,
            h.selected_text,
            h.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(h)
}

pub fn remove_highlight(id: String) -> Result<bool, String> {
    let conn = get_conn()?;
    let affected = conn
        .execute("DELETE FROM highlights WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(affected > 0)
}

pub fn clear_all_highlights() -> Result<bool, String> {
    let conn = get_conn()?;
    conn.execute("DELETE FROM highlights", [])
        .map_err(|e| e.to_string())?;
    Ok(true)
}

pub fn clear_paragraph_highlights(paragraph_id: String) -> Result<bool, String> {
    let conn = get_conn()?;
    conn.execute("DELETE FROM highlights WHERE paragraph_id = ?1", params![paragraph_id])
        .map_err(|e| e.to_string())?;
    Ok(true)
}

pub fn fetch_notes() -> Result<Vec<Note>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, paragraph_id, highlight_id, book_id, chapter_title, note_text, created_at, updated_at FROM notes ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                paragraph_id: row.get(1)?,
                highlight_id: row.get(2)?,
                book_id: row.get(3)?,
                chapter_title: row.get(4)?,
                note_text: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for item in iter {
        if let Ok(n) = item {
            res.push(n);
        }
    }
    Ok(res)
}

pub fn insert_note(n: Note) -> Result<Note, String> {
    let conn = get_conn()?;
    conn.execute(
        "INSERT INTO notes (id, paragraph_id, highlight_id, book_id, chapter_title, note_text, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, COALESCE(?7, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
            note_text = excluded.note_text,
            updated_at = CURRENT_TIMESTAMP",
        params![
            n.id,
            n.paragraph_id,
            n.highlight_id,
            n.book_id,
            n.chapter_title,
            n.note_text,
            n.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(n)
}

pub fn remove_note(id: String) -> Result<bool, String> {
    let conn = get_conn()?;
    let affected = conn
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(affected > 0)
}

pub fn fetch_favorites() -> Result<Vec<Favorite>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, item_type, target_id, title, preview_text, created_at FROM favorites ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Favorite {
                id: row.get(0)?,
                item_type: row.get(1)?,
                target_id: row.get(2)?,
                title: row.get(3)?,
                preview_text: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for item in iter {
        if let Ok(f) = item {
            res.push(f);
        }
    }
    Ok(res)
}

pub fn set_favorite(f: Favorite) -> Result<bool, String> {
    let conn = get_conn()?;
    
    // Check if already favorited
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(1) FROM favorites WHERE target_id = ?1",
            params![f.target_id],
            |row| row.get::<_, i64>(0).map(|c| c > 0),
        )
        .unwrap_or(false);

    if exists {
        conn.execute("DELETE FROM favorites WHERE target_id = ?1", params![f.target_id])
            .map_err(|e| e.to_string())?;
        Ok(false) // removed
    } else {
        conn.execute(
            "INSERT INTO favorites (id, item_type, target_id, title, preview_text, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)",
            params![f.id, f.item_type, f.target_id, f.title, f.preview_text],
        )
        .map_err(|e| e.to_string())?;
        Ok(true) // added
    }
}

pub fn fetch_reading_progress() -> Result<Option<ReadingProgress>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT last_paragraph_id, last_book_id, last_chapter_id, scroll_percentage, updated_at FROM reading_progress WHERE id = 1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map([], |row| {
            Ok(ReadingProgress {
                last_paragraph_id: row.get(0)?,
                last_book_id: row.get(1)?,
                last_chapter_id: row.get(2)?,
                scroll_percentage: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    if let Some(Ok(prog)) = rows.next() {
        Ok(Some(prog))
    } else {
        Ok(None)
    }
}

pub fn set_reading_progress(prog: ReadingProgress) -> Result<ReadingProgress, String> {
    let conn = get_conn()?;
    conn.execute(
        "INSERT INTO reading_progress (id, last_paragraph_id, last_book_id, last_chapter_id, scroll_percentage, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
            last_paragraph_id = excluded.last_paragraph_id,
            last_book_id = excluded.last_book_id,
            last_chapter_id = excluded.last_chapter_id,
            scroll_percentage = excluded.scroll_percentage,
            updated_at = CURRENT_TIMESTAMP",
        params![
            prog.last_paragraph_id,
            prog.last_book_id,
            prog.last_chapter_id,
            prog.scroll_percentage
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(prog)
}

pub fn fetch_reading_stats(date_str: &str) -> Result<ReadingStats, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT words_read, paragraphs_read, minutes_spent FROM reading_stats WHERE date = ?1")
        .map_err(|e| e.to_string())?;

    let row = stmt.query_row(params![date_str], |row| {
        Ok(ReadingStats {
            date: date_str.to_string(),
            words_read: row.get(0)?,
            paragraphs_read: row.get(1)?,
            minutes_spent: row.get(2)?,
        })
    });

    match row {
        Ok(stats) => Ok(stats),
        Err(_) => Ok(ReadingStats {
            date: date_str.to_string(),
            words_read: 0,
            paragraphs_read: 0,
            minutes_spent: 0,
        }),
    }
}

pub fn add_reading_activity(
    date_str: &str,
    words: i64,
    paragraphs: i64,
    minutes: i64,
) -> Result<ReadingStats, String> {
    let conn = get_conn()?;
    conn.execute(
        "INSERT INTO reading_stats (date, words_read, paragraphs_read, minutes_spent)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(date) DO UPDATE SET
            words_read = words_read + excluded.words_read,
            paragraphs_read = paragraphs_read + excluded.paragraphs_read,
            minutes_spent = minutes_spent + excluded.minutes_spent",
        params![date_str, words, paragraphs, minutes],
    )
    .map_err(|e| e.to_string())?;

    fetch_reading_stats(date_str)
}
