#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::{Manager, State};

struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
fn start_backend(state: State<BackendProcess>) -> Result<String, String> {
    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    if process_guard.is_some() {
        return Ok("Backend already running".to_string());
    }

    // Start the Python backend
    let child = Command::new("python3")
        .args(["-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", "8000"])
        .spawn()
        .map_err(|e| format!("Failed to start backend: {}", e))?;

    *process_guard = Some(child);
    Ok("Backend started".to_string())
}

#[tauri::command]
fn stop_backend(state: State<BackendProcess>) -> Result<String, String> {
    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = process_guard.take() {
        child.kill().map_err(|e| format!("Failed to stop backend: {}", e))?;
        Ok("Backend stopped".to_string())
    } else {
        Ok("Backend not running".to_string())
    }
}

#[tauri::command]
fn check_ollama() -> Result<bool, String> {
    let output = Command::new("ollama")
        .arg("list")
        .output()
        .map_err(|e| format!("Failed to check Ollama: {}", e))?;

    Ok(output.status.success())
}

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            start_backend,
            stop_backend,
            check_ollama
        ])
        .setup(|app| {
            // Auto-start backend on app launch
            let handle = app.handle();
            std::thread::spawn(move || {
                // Give the app time to initialize
                std::thread::sleep(std::time::Duration::from_secs(2));

                // Start the backend
                let state: State<BackendProcess> = handle.state();
                if let Err(e) = start_backend(state) {
                    eprintln!("Failed to start backend: {}", e);
                }
            });

            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
                // Stop backend when window closes
                let handle = event.window().app_handle();
                let state: State<BackendProcess> = handle.state();
                let _ = stop_backend(state);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
