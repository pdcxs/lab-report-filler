use crate::commands::typst::generate_typst;
use crate::model::{LabConfig, StudentData};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub pdf_path: String,
    pub file_name: String,
}

/// 尝试以写模式打开文件，成功说明未被占用。
/// 失败返回 Err("PDF_LOCKED")。
fn ensure_not_locked(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
    // Windows 上如果被 Adobe / Edge / Chrome 打开，write 打开会失败。
    // macOS 上大多数预览器允许写打开，所以这里可能不生效——见文末说明。
    match fs::OpenOptions::new().write(true).open(path) {
        Ok(_) => Ok(()),
        Err(_) => Err("PDF_LOCKED".into()),
    }
}

#[tauri::command]
pub async fn export_pdf(
    app: AppHandle,
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<ExportResult, String> {
    // 1. 生成 typ
    let generated = generate_typst(dir.clone(), config.clone(), data.clone())?;
    let typ_path = PathBuf::from(&generated.typst_path);

    // 2. 目标 PDF 路径
    let pdf_name = config
        .export
        .file_name_pattern
        .replace("{studentName}", &data.name)
        .replace("{studentId}", &data.student_id);
    let pdf_path = Path::new(&dir).join(&pdf_name);

    // 3. 如果已存在，先看是否被占用
    if pdf_path.exists() && config.export.require_file_closed {
        ensure_not_locked(&pdf_path)?;
    }

    // 4. 调 sidecar
    let fonts = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("fonts");
    let sidecar = app
        .shell()
        .sidecar("typst")
        .map_err(|e| format!("sidecar not found: {e}"))?;
    let output = sidecar
        .args([
            "compile",
            "--font-path",
            fonts.to_str().ok_or("Invalid font path")?,
            "--root",
            &dir,
            typ_path.to_str().ok_or("Invalid typ path")?,
            pdf_path.to_str().ok_or("Invalid pdf path")?,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Typst compile failed:\n{stderr}"));
    }

    Ok(ExportResult {
        pdf_path: pdf_path.to_string_lossy().to_string(),
        file_name: pdf_name,
    })
}
