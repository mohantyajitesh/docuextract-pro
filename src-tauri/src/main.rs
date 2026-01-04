#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use tauri::api::process::{Command, CommandChild};
use tauri::{Manager, State};

struct BackendProcess(Mutex<Option<CommandChild>>);

#[tauri::command]
fn start_backend(state: State<BackendProcess>, app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    if process_guard.is_some() {
        return Ok("Backend already running".to_string());
    }

    // Try to use sidecar (bundled binary) first, fall back to Python for development
    let (mut rx, child) = if cfg!(debug_assertions) {
        // Development mode: use Python directly
        Command::new("python3")
            .args(["-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", "8000"])
            .spawn()
            .map_err(|e| format!("Failed to start backend (dev mode): {}", e))?
    } else {
        // Production mode: use sidecar binary
        Command::new_sidecar("docuextract-backend")
            .map_err(|e| format!("Failed to create sidecar command: {}", e))?
            .spawn()
            .map_err(|e| format!("Failed to start backend sidecar: {}", e))?
    };

    // Log sidecar output in background
    tauri::async_runtime::spawn(async move {
        use tauri::api::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => println!("[Backend] {}", line),
                CommandEvent::Stderr(line) => eprintln!("[Backend Error] {}", line),
                CommandEvent::Error(error) => eprintln!("[Backend Fatal] {}", error),
                CommandEvent::Terminated(payload) => {
                    println!("[Backend] Process terminated with code: {:?}", payload.code);
                    break;
                }
                _ => {}
            }
        }
    });

    *process_guard = Some(child);
    Ok("Backend started".to_string())
}

#[tauri::command]
fn stop_backend(state: State<BackendProcess>) -> Result<String, String> {
    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(child) = process_guard.take() {
        child.kill().map_err(|e| format!("Failed to stop backend: {}", e))?;
        Ok("Backend stopped".to_string())
    } else {
        Ok("Backend not running".to_string())
    }
}

#[tauri::command]
fn check_ollama() -> Result<bool, String> {
    let output = std::process::Command::new("ollama")
        .arg("list")
        .output()
        .map_err(|e| format!("Failed to check Ollama: {}", e))?;

    Ok(output.status.success())
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            start_backend,
            stop_backend,
            check_ollama,
            get_app_version
        ])
        .setup(|app| {
            let handle = app.handle();

            // Auto-start backend on app launch
            std::thread::spawn(move || {
                // Give the app time to initialize
                std::thread::sleep(std::time::Duration::from_secs(2));

                // Start the backend
                let state: State<BackendProcess> = handle.state();
                match start_backend(state, handle.clone()) {
                    Ok(msg) => println!("{}", msg),
                    Err(e) => eprintln!("Failed to start backend: {}", e),
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
