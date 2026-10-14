use crate::model::LabConfig;
use std::fs;
use std::path::Path;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LabSession {
    pub dir: String,
    pub config: LabConfig,
}

/// 打开一个实验目录：读取其中的 lab.json。
#[tauri::command]
pub fn open_lab_dir(path: String) -> Result<LabSession, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {path}"));
    }
    let config_path = dir.join("lab.json");
    if !config_path.is_file() {
        return Err("The selected folder does not contain a lab.json file.".into());
    }
    let text = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: LabConfig =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse lab.json: {e}"))?;
    Ok(LabSession {
        dir: dir.to_string_lossy().to_string(),
        config,
    })
}
