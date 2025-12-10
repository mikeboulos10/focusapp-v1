use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use rusqlite::{params, Connection};
use tauri::{api::notification::Notification, Manager};

#[cfg(target_os = "macos")]
mod macos_window;

#[cfg(target_os = "macos")]
use macos_window::get_active_window_info;

#[derive(Clone, Debug)]
pub struct AppState {
  pub tracking: bool,
  pub distraction_sites: HashSet<String>,
  pub whitelist_sites: HashSet<String>,
  pub api_key: String,
  pub alert_image_path: Option<String>,
  pub db_conn: Connection,
}

impl AppState {
  pub fn new(db_path: &str) -> Self {
    let conn = Connection::open(db_path).expect("Failed to open DB");
    conn.execute_batch(
      "
      CREATE TABLE IF NOT EXISTS time_logs (
          id INTEGER PRIMARY KEY,
          website TEXT NOT NULL,
          window_title TEXT,
          start_time INTEGER NOT NULL,
          duration INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
      );
      ",
    )
    .expect("Failed to create tables");
    Self {
      tracking: false,
      distraction_sites: HashSet::new(),
      whitelist_sites: HashSet::new(),
      api_key: "".to_string(),
      alert_image_path: None,
      db_conn: conn,
    }
  }

  pub fn save_preference(&self, key: &str, value: &str) {
    self.db_conn
      .execute(
        "INSERT INTO preferences (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
      )
      .expect("Failed to save preference");
  }

  pub fn load_preference(&self, key: &str) -> Option<String> {
    let mut stmt = self
      .db_conn
      .prepare("SELECT value FROM preferences WHERE key = ?1")
      .expect("Failed to prepare preference statement");
    let mut rows = stmt.query(params![key]).expect("Failed to query preference");
    if let Some(row) = rows.next().expect("Failed to fetch preference") {
      let val: String = row.get(0).expect("Failed to get preference value");
      Some(val)
    } else {
      None
    }
  }
}

#[derive(Serialize)]
struct GeminiRequest {
  model: String,
  prompt: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
  candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
struct Candidate {
  content: ContentText,
}

#[derive(Deserialize)]
struct ContentText {
  parts: Vec<String>,
}

#[derive(Debug)]
pub struct WindowInfo {
  pub app_name: String,
  pub window_title: String,
  pub url: Option<String>,
}

#[tauri::command]
pub fn save_settings(
  api_key: String,
  distraction_sites: Vec<String>,
  whitelist_sites: Vec<String>,
  alert_image_path: Option<String>,
  state: tauri::State<Arc<Mutex<AppState>>>,
) -> Result<(), String> {
  let mut appstate = state.lock().unwrap();
  appstate.api_key = api_key;
  appstate.distraction_sites = distraction_sites.into_iter().collect();
  appstate.whitelist_sites = whitelist_sites.into_iter().collect();
  appstate.alert_image_path = alert_image_path;

  appstate.save_preference("api_key", &appstate.api_key);
  appstate.save_preference(
    "distraction_sites",
    &serde_json::to_string(&appstate.distraction_sites).unwrap(),
  );
  appstate.save_preference(
    "whitelist_sites",
    &serde_json::to_string(&appstate.whitelist_sites).unwrap(),
  );
  if let Some(img_path) = &appstate.alert_image_path {
    appstate.save_preference("alert_image_path", img_path);
  }
  Ok(())
}

#[tauri::command]
pub fn load_settings(
  state: tauri::State<Arc<Mutex<AppState>>>,
) -> Result<(String, Vec<String>, Vec<String>, Option<String>), String> {
  let appstate = state.lock().unwrap();
  let api_key = appstate.load_preference("api_key").unwrap_or_default();
  let distraction_sites: Vec<String> = appstate
    .load_preference("distraction_sites")
    .and_then(|v| serde_json::from_str(&v).ok())
    .unwrap_or_default();
  let whitelist_sites: Vec<String> = appstate
    .load_preference("whitelist_sites")
    .and_then(|v| serde_json::from_str(&v).ok())
    .unwrap_or_default();
  let alert_image_path = appstate.load_preference("alert_image_path");
  Ok((api_key, distraction_sites, whitelist_sites, alert_image_path))
}

fn save_time_log(
  conn: &Connection,
  website: &str,
  window_title: &str,
  start_time: i64,
  duration: i64,
) -> Result<(), rusqlite::Error> {
  conn.execute(
    "INSERT INTO time_logs (website, window_title, start_time, duration) VALUES (?1, ?2, ?3, ?4)",
    params![website, window_title, start_time, duration],
  )
  .map(|_| ())
}

fn is_distraction_website(appstate: &AppState, site: &str) -> bool {
  if appstate.whitelist_sites.contains(site) {
    return false;
  }
  appstate.distraction_sites.contains(site)
}

fn show_popup_alert(alert_image_path: Option<String>) {
  let mut notification = Notification::new("com.focusapp.dev")
    .title("Pop up detected back to work")
    .body("Your focus is important!");
  if let Some(img_path) = alert_image_path {
    notification = notification.icon(&img_path);
  }
  let _ = notification.show();
}

fn enable_hard_mode(blocklist: Vec<String>, duration_minutes: u32) -> Result<(), String> {
  let blocklist_file = "/tmp/selfcontrol_blocklist.txt";
  std::fs::write(&blocklist_file, blocklist.join("\n"))
    .map_err(|e| format!("Failed to write blocklist file: {}", e))?;
  let status = Command::new("/Applications/SelfControl.app/Contents/MacOS/SelfControl")
    .args(["start", blocklist_file, &duration_minutes.to_string()])
    .status()
    .map_err(|e| format!("Failed to execute SelfControl: {}", e))?;
  if !status.success() {
    return Err("SelfControl failed to start".into());
  }
  Ok(())
}

fn spawn_tracking_loop(state: Arc<Mutex<AppState>>) {
  thread::spawn(move || {
    loop {
      {
        let appstate = state.lock().unwrap();
        if !appstate.tracking {
          drop(appstate);
          thread::sleep(Duration::from_secs(5));
          continue;
        }
      }

      #[cfg(target_os = "macos")]
      let win_info = get_active_window_info();

      #[cfg(not(target_os = "macos"))]
      let win_info = None;

      if let Some(window_info) = win_info {
        let website = window_info
          .url
          .clone()
          .unwrap_or(window_info.window_title.clone());

        {
          let mut appstate = state.lock().unwrap();
          // Simplified: store a time log every tick with 1s duration
          let now = chrono::Utc::now().timestamp();
          let _ = save_time_log(
            &appstate.db_conn,
            &website,
            &window_info.window_title,
            now,
            1,
          );

          if is_distraction_website(&appstate, &website) {
            show_popup_alert(appstate.alert_image_path.clone());
          }
        }
      }

      thread::sleep(Duration::from_secs(1));
    }
  });
}

#[tauri::command]
pub fn start_tracking(state: tauri::State<Arc<Mutex<AppState>>>) -> Result<(), String> {
  let mut appstate = state.lock().unwrap();
  if appstate.tracking {
    return Err("Already tracking".into());
  }
  appstate.tracking = true;
  drop(appstate);
  let state_clone = state.inner().clone();
  spawn_tracking_loop(state_clone);
  Ok(())
}

#[tauri::command]
pub fn stop_tracking(state: tauri::State<Arc<Mutex<AppState>>>) -> Result<(), String> {
  let mut appstate = state.lock().unwrap();
  appstate.tracking = false;
  Ok(())
}

#[tauri::command]
pub fn toggle_tracking(state: tauri::State<Arc<Mutex<AppState>>>) -> Result<bool, String> {
  let mut appstate = state.lock().unwrap();
  appstate.tracking = !appstate.tracking;
  Ok(appstate.tracking)
}

#[tauri::command]
pub fn get_tracking_status(state: tauri::State<Arc<Mutex<AppState>>>) -> bool {
  let appstate = state.lock().unwrap();
  appstate.tracking
}

#[tauri::command]
pub fn activate_hard_mode(
  blocklist: Vec<String>,
  duration_minutes: u32,
) -> Result<(), String> {
  enable_hard_mode(blocklist, duration_minutes)
}

#[derive(Serialize)]
pub struct TimeLogSummary {
  pub website: String,
  pub total_duration_secs: i64,
}

#[tauri::command]
pub fn get_time_logs_summary(
  state: tauri::State<Arc<Mutex<AppState>>>,
) -> Result<Vec<TimeLogSummary>, String> {
  let appstate = state.lock().unwrap();
  let mut stmt = appstate
    .db_conn
    .prepare(
      "SELECT website, SUM(duration) as total_duration_secs
       FROM time_logs
       GROUP BY website
       ORDER BY total_duration_secs DESC
       LIMIT 20",
    )
    .map_err(|e| e.to_string())?;

  let log_iter = stmt
    .query_map([], |row| {
      Ok(TimeLogSummary {
        website: row.get(0)?,
        total_duration_secs: row.get(1)?,
      })
    })
    .map_err(|e| e.to_string())?;

  let mut res = Vec::new();
  for log in log_iter {
    res.push(log.map_err(|e| e.to_string())?);
  }
  Ok(res)
}
