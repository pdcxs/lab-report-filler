use crate::model::{LabConfig, StudentData};
use std::fs;
use std::path::{Path, PathBuf};

fn resolve_data_file(dir: &Path, config: &LabConfig, data: &StudentData) -> PathBuf {
    let name = if data.student_id.is_empty() {
        config.storage.draft_file_name.clone()
    } else {
        config
            .storage
            .data_file_name_pattern
            .replace("{studentId}", &data.student_id)
    };
    dir.join(name)
}

#[tauri::command]
pub fn load_student_data(
    dir: String,
    config: LabConfig,
    student_id: Option<String>,
) -> Result<StudentData, String> {
    let dir_path = Path::new(&dir);

    // 优先读带学号的文件；读不到再读草稿。
    let candidates = match &student_id {
        Some(id) if !id.is_empty() => vec![
            dir_path.join(
                config
                    .storage
                    .data_file_name_pattern
                    .replace("{studentId}", id),
            ),
            dir_path.join(&config.storage.draft_file_name),
        ],
        _ => vec![dir_path.join(&config.storage.draft_file_name)],
    };

    for path in candidates {
        if path.is_file() {
            let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let data: StudentData = serde_json::from_str(&text)
                .map_err(|e| format!("Failed to parse {}: {e}", path.display()))?;
            return Ok(data);
        }
    }
    Ok(StudentData::default())
}

/// 保存学生数据，返回实际写入的文件名。
#[tauri::command]
pub fn save_student_data(
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<String, String> {
    let dir_path = Path::new(&dir);
    fs::create_dir_all(dir_path).map_err(|e| e.to_string())?;
    let path = resolve_data_file(dir_path, &config, &data);
    let text = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default())
}
