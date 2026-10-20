mod commands;
mod model;
mod typst_gen;

use commands::{config, export, image, settings, storage, teacher, typst, validate, zip};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            config::open_lab_dir,
            settings::load_settings,
            settings::save_settings,
            settings::load_teacher_draft,
            settings::save_teacher_draft,
            settings::clear_teacher_draft,
            storage::load_student_data,
            storage::save_student_data,
            storage::read_text_file,
            image::import_image,
            typst::generate_typst,
            typst::compile_preview,
            typst::check_typst,
            validate::validate_report,
            export::export_pdf,
            zip::extract_zip,
            teacher::teacher_export,
            teacher::preview_teacher_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
