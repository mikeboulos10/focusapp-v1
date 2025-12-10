#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager};
use std::sync::{Arc, Mutex};
mod backend;

fn main() {
    let state = Arc::new(Mutex::new(backend::AppState::new("focus_app.db")));

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            backend::save_settings,
            backend::load_settings,
            backend::start_tracking,
            backend::stop_tracking,
            backend::toggle_tracking,
            backend::get_tracking_status,
            backend::activate_hard_mode,
            backend::get_time_logs_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
