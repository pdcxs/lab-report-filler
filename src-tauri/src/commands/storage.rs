use crate::model::{LabConfig, StudentData};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[tauri::command]
pub fn save_student_data(
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<String, String> {
    let dir_path = Path::new(&dir);
    fs::create_dir_all(dir_path).map_err(|e| e.to_string())?;
    let path = dir_path.join(&config.storage.draft_file_name);
    let text = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default())
}

#[tauri::command]
pub fn load_student_data(
    dir: String,
    config: LabConfig,
    student_id: Option<String>,
) -> Result<StudentData, String> {
    let _ = student_id;
    let dir_path = Path::new(&dir);

    let mut candidates: Vec<(SystemTime, PathBuf)> = Vec::new();

    let draft = dir_path.join(&config.storage.draft_file_name);
    if let Ok(meta) = fs::metadata(&draft) {
        if let Ok(mtime) = meta.modified() {
            candidates.push((mtime, draft));
        }
    }

    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if !p.is_file() {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
            if !name.starts_with("report-") || !name.ends_with(".json") {
                continue;
            }
            if let Ok(meta) = entry.metadata() {
                if let Ok(mtime) = meta.modified() {
                    candidates.push((mtime, p));
                }
            }
        }
    }

    candidates.sort_by(|a, b| b.0.cmp(&a.0));

    for (_, path) in candidates {
        let text = match fs::read_to_string(&path) {
            Ok(t) => t,
            Err(e) => {
                eprintln!("Failed to read {}: {e}", path.display());
                continue;
            }
        };
        match serde_json::from_str::<StudentData>(&text) {
            Ok(data) => return Ok(data),
            Err(e) => {
                eprintln!("Failed to parse {}: {e}", path.display());
                continue;
            }
        }
    }

    Ok(StudentData::default())
}
