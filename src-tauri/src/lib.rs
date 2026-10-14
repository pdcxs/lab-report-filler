mod commands;
mod model;
mod typst_gen;

use commands::{config, export, image, settings, storage, typst, validate};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            config::open_lab_dir,
            settings::load_settings,
            settings::save_settings,
            storage::load_student_data,
            storage::save_student_data,
            image::import_image,
            typst::generate_typst,
            typst::compile_preview,
            validate::validate_report,
            export::export_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
