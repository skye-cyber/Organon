use crate::db::{
    self, Favorite, Highlight, Note, ReadingProgress, ReadingStats,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const EMBEDDED_ORGANON: &str = include_str!("../../data/organon_english.json");
const EMBEDDED_SCHEMA: &str = include_str!("../../data/organon.json");

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub paragraph_id: String,
    pub book_id: String,
    pub book_title: String,
    pub chapter_id: String,
    pub chapter_title: String,
    pub bekker: Option<String>,
    pub snippet: String,
    pub match_count: usize,
}

#[tauri::command]
pub fn get_organon_data(file_path: Option<String>) -> Result<serde_json::Value, String> {
    // 1. Try explicit path if provided
    if let Some(ref custom) = file_path {
        let p = PathBuf::from(custom);
        if p.exists() {
            let content = fs::read_to_string(&p)
                .map_err(|e| format!("Failed to read custom file: {}", e))?;
            return serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse custom JSON: {}", e));
        }
    }

    // 2. Try candidate filesystem paths (for desktop development)
    let candidate_paths = [
        PathBuf::from("data/organon_english.json"),
        PathBuf::from("data/organon.json"),
        PathBuf::from("../data/organon_english.json"),
        PathBuf::from("../data/organon.json"),
    ];

    for path in &candidate_paths {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(val) = serde_json::from_str(&content) {
                    return Ok(val);
                }
            }
        }
    }

    // 3. Fallback to embedded compile-time data (crucial for Android APK bundle)
    serde_json::from_str(EMBEDDED_ORGANON)
        .map_err(|e| format!("Failed to parse embedded Organon data: {}", e))
}

#[tauri::command]
pub fn get_sample_schema() -> Result<serde_json::Value, String> {
    let candidate_paths = [
        PathBuf::from("data/organon.json"),
        PathBuf::from("../data/organon.json"),
    ];

    for path in &candidate_paths {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(val) = serde_json::from_str(&content) {
                    return Ok(val);
                }
            }
        }
    }

    serde_json::from_str(EMBEDDED_SCHEMA)
        .map_err(|e| format!("Failed to parse embedded schema: {}", e))
}

#[tauri::command]
pub fn search_full_text(query: String) -> Result<Vec<SearchResult>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }

    let data = get_organon_data(None)?;
    let mut results = Vec::new();

    if let Some(books) = data.get("books").and_then(|b| b.as_array()) {
        for book in books {
            let book_id = book.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let book_title = book.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();

            if let Some(parts) = book.get("parts").and_then(|p| p.as_array()) {
                for part in parts {
                    if let Some(chapters) = part.get("chapters").and_then(|c| c.as_array()) {
                        for chapter in chapters {
                            let chapter_id = chapter.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                            let chapter_title = chapter.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();

                            if let Some(paragraphs) = chapter.get("paragraphs").and_then(|p| p.as_array()) {
                                for par in paragraphs {
                                    let par_id = par.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                    let bekker = par.get("bekker").and_then(|v| v.as_str()).map(|s| s.to_string());
                                    let text = par.get("text").and_then(|v| v.as_str()).unwrap_or("");

                                    let text_lower = text.to_lowercase();
                                    if let Some(first_idx) = text_lower.find(&q) {
                                        let match_count = text_lower.matches(&q).count();

                                        let start = if first_idx > 40 { first_idx - 40 } else { 0 };
                                        let end = std::cmp::min(first_idx + q.len() + 80, text.len());
                                        let mut snippet = text[start..end].to_string();
                                        if start > 0 {
                                            snippet = format!("...{}", snippet);
                                        }
                                        if end < text.len() {
                                            snippet = format!("{}...", snippet);
                                        }

                                        results.push(SearchResult {
                                            paragraph_id: par_id,
                                            book_id: book_id.clone(),
                                            book_title: book_title.clone(),
                                            chapter_id: chapter_id.clone(),
                                            chapter_title: chapter_title.clone(),
                                            bekker,
                                            snippet,
                                            match_count,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn get_highlights() -> Result<Vec<Highlight>, String> {
    db::fetch_highlights()
}

#[tauri::command]
pub fn save_highlight(highlight: Highlight) -> Result<Highlight, String> {
    db::insert_highlight(highlight)
}

#[tauri::command]
pub fn delete_highlight(id: String) -> Result<bool, String> {
    db::remove_highlight(id)
}

#[tauri::command]
pub fn clear_all_highlights() -> Result<bool, String> {
    db::clear_all_highlights()
}

#[tauri::command]
pub fn clear_paragraph_highlights(paragraph_id: String) -> Result<bool, String> {
    db::clear_paragraph_highlights(paragraph_id)
}

#[tauri::command]
pub fn get_notes() -> Result<Vec<Note>, String> {
    db::fetch_notes()
}

#[tauri::command]
pub fn save_note(note: Note) -> Result<Note, String> {
    db::insert_note(note)
}

#[tauri::command]
pub fn delete_note(id: String) -> Result<bool, String> {
    db::remove_note(id)
}

#[tauri::command]
pub fn get_favorites() -> Result<Vec<Favorite>, String> {
    db::fetch_favorites()
}

#[tauri::command]
pub fn toggle_favorite(favorite: Favorite) -> Result<bool, String> {
    db::set_favorite(favorite)
}

#[tauri::command]
pub fn get_reading_progress() -> Result<Option<ReadingProgress>, String> {
    db::fetch_reading_progress()
}

#[tauri::command]
pub fn save_reading_progress(progress: ReadingProgress) -> Result<ReadingProgress, String> {
    db::set_reading_progress(progress)
}

#[tauri::command]
pub fn get_reading_stats(date: Option<String>) -> Result<ReadingStats, String> {
    let date_str = date.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());
    db::fetch_reading_stats(&date_str)
}

#[tauri::command]
pub fn record_reading_activity(
    words: i64,
    paragraphs: i64,
    minutes: i64,
    date: Option<String>,
) -> Result<ReadingStats, String> {
    let date_str = date.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());
    db::add_reading_activity(&date_str, words, paragraphs, minutes)
}
