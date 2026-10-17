use crate::model::{LabConfig, StudentData};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

/// 始终保存到 draft 文件，避免因学号变化产生多个中间文件。
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
    let _ = student_id; // 保留参数以兼容前端调用，读取逻辑不再依赖它

    let dir_path = Path::new(&dir);

    // 1. 优先读 draft（总是反映最近一次编辑的状态）
    let draft = dir_path.join(&config.storage.draft_file_name);
    if draft.is_file() {
        let text = fs::read_to_string(&draft).map_err(|e| e.to_string())?;
        let data: StudentData = serde_json::from_str(&text)
            .map_err(|e| format!("Failed to parse {}: {e}", draft.display()))?;
        return Ok(data);
    }

    // 2. 没有 draft，回退到修改时间最新的 report-*.json
    if let Some(path) = find_latest_report(dir_path, &config.storage.draft_file_name) {
        let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let data: StudentData = serde_json::from_str(&text)
            .map_err(|e| format!("Failed to parse {}: {e}", path.display()))?;
        return Ok(data);
    }

    // 3. 什么都没有
    Ok(StudentData::default())
}

fn find_latest_report(dir: &Path, draft_name: &str) -> Option<PathBuf> {
    let mut best: Option<(SystemTime, PathBuf)> = None;
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let p = entry.path();
        if !p.is_file() {
            continue;
        }
        let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
        if !name.starts_with("report-") || !name.ends_with(".json") || name == draft_name {
            continue;
        }
        if let Ok(meta) = entry.metadata() {
            if let Ok(mtime) = meta.modified() {
                if best.as_ref().map_or(true, |(t, _)| mtime > *t) {
                    best = Some((mtime, p));
                }
            }
        }
    }
    best.map(|(_, p)| p)
}

/// 导出成功后调用：生成 `report-{studentId}.json` 定稿。
/// 如果学号为空，不做任何事。
pub fn snapshot_to_student_file(
    dir: &Path,
    config: &LabConfig,
    data: &StudentData,
) -> Result<Option<String>, String> {
    if data.student_id.trim().is_empty() {
        return Ok(None);
    }
    let name = config
        .storage
        .data_file_name_pattern
        .replace("{studentId}", &data.student_id);
    let path = dir.join(&name);
    let text = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(Some(name))
}