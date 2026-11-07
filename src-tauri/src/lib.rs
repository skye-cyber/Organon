mod commands;
mod db;

use std::sync::atomic::AtomicBool;
#[cfg(desktop)]
use std::sync::atomic::Ordering;
#[cfg(desktop)]
use tauri::{AppHandle, Manager, Runtime, WindowEvent};

// Desktop-only imports — tray, menu, and global shortcuts
#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
#[cfg(desktop)]
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// AppState for close-to-tray on desktop
pub struct AppState {
    pub is_quitting: AtomicBool,
}

// ---- Desktop Tray --------------------------------------------------------

#[cfg(desktop)]
fn build_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let show_i = MenuItem::with_id(app, "show", "Show Organon", true, None::<&str>)?;
    let zen_i = MenuItem::with_id(app, "zen", "Toggle Focus Mode", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Organon", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_i, &zen_i, &sep, &quit_i])?;

    // Try resolving icon from icons directory
    let icon = {
        let candidate_paths = [
            std::path::PathBuf::from("icons/32x32.png"),
            std::path::PathBuf::from("src-tauri/icons/32x32.png"),
            std::path::PathBuf::from("../src-tauri/icons/32x32.png"),
        ];
        let mut loaded = None;
        for path in &candidate_paths {
            if path.exists() {
                if let Ok(img) = tauri::image::Image::from_path(path) {
                    loaded = Some(img);
                    break;
                }
            }
        }
        loaded.unwrap_or_else(|| {
            // Generate in-memory fallback 32x32 icon if needed
            let mut rgba = Vec::with_capacity(32 * 32 * 4);
            for _ in 0..(32 * 32) {
                rgba.extend_from_slice(&[212, 175, 55, 255]); // Gold pixel
            }
            tauri::image::Image::new_owned(rgba, 32, 32)
        })
    };

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("Aristotle's Organon")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "zen" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.__toggleZenMode && window.__toggleZenMode()");
                }
            }
            "quit" => {
                app.state::<AppState>()
                    .is_quitting
                    .store(true, Ordering::SeqCst);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            } else if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

// ---- Desktop Window Event Handling (Close to Tray) -----------------------

#[cfg(desktop)]
fn wire_main_window<R: Runtime>(app: &AppHandle<R>) {
    let Some(main) = app.get_webview_window("main") else {
        return;
    };

    let main_clone = main.clone();
    main.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            let state = main_clone.app_handle().state::<AppState>();
            if !state.is_quitting.load(Ordering::SeqCst) {
                api.prevent_close();
                let _ = main_clone.hide();
            }
        }
    });
}

// ---- Global Shortcuts ----------------------------------------------------

#[cfg(desktop)]
fn register_shortcuts<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // F12 — toggle devtools
    let f12 = Shortcut::new(None, Code::F12);
    let _ = app.global_shortcut().on_shortcut(f12, |app, _sc, ev| {
        #[cfg(debug_assertions)]
        if ev.state == ShortcutState::Pressed {
            if let Some(win) = app.get_webview_window("main") {
                if win.is_devtools_open() {
                    win.close_devtools();
                } else {
                    win.open_devtools();
                }
            }
        }
    });

    // F11 — toggle fullscreen
    let f11 = Shortcut::new(None, Code::F11);
    let _ = app.global_shortcut().on_shortcut(f11, |app, _sc, ev| {
        if ev.state == ShortcutState::Pressed {
            if let Some(win) = app.get_webview_window("main") {
                if let Ok(is_fs) = win.is_fullscreen() {
                    let _ = win.set_fullscreen(!is_fs);
                }
            }
        }
    });

    // Ctrl+Alt+O / Cmd+Alt+O — Quick summon Organon
    #[cfg(target_os = "macos")]
    let summon = Shortcut::new(Some(Modifiers::META | Modifiers::ALT), Code::KeyO);
    #[cfg(not(target_os = "macos"))]
    let summon = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyO);

    let _ = app.global_shortcut().on_shortcut(summon, |app, _sc, ev| {
        if ev.state == ShortcutState::Pressed {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }
    });

    Ok(())
}

// ---- App Builder ---------------------------------------------------------

fn build_app() -> tauri::Builder<tauri::Wry> {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());

    builder
}

// ---- App Entry Point -----------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    build_app()
        .manage(AppState {
            is_quitting: AtomicBool::new(false),
        })
        .setup(|app| {
            let handle = app.handle().clone();

            // Initialize SQLite DB
            if let Err(e) = db::init_db(&handle) {
                eprintln!("[Organon] Failed to initialize SQLite database: {}", e);
            } else {
                println!("[Organon] SQLite database initialized successfully");
            }

            // Desktop-specific setup: tray, close interception, global shortcuts
            #[cfg(desktop)]
            {
                if let Err(e) = register_shortcuts(&handle) {
                    eprintln!("[Organon] Global shortcuts registration notice: {e}");
                }

                if let Err(e) = build_tray(&handle) {
                    eprintln!("[Organon] Tray icon build error: {e}");
                }

                wire_main_window(&handle);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_organon_data,
            commands::get_sample_schema,
            commands::search_full_text,
            commands::get_highlights,
            commands::save_highlight,
            commands::delete_highlight,
            commands::clear_all_highlights,
            commands::clear_paragraph_highlights,
            commands::get_notes,
            commands::save_note,
            commands::delete_note,
            commands::get_favorites,
            commands::toggle_favorite,
            commands::get_reading_progress,
            commands::save_reading_progress,
            commands::get_reading_stats,
            commands::record_reading_activity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
