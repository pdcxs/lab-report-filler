use crate::commands::storage::snapshot_to_student_file;
use crate::commands::typst::{format_typst_error, generate_typst, run_typst};
use crate::model::{LabConfig, StudentData};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub pdf_path: String,
    pub file_name: String,
}

fn ensure_not_locked(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
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
    // 1. 生成临时 typ（report-draft.typ）
    let generated = generate_typst(dir.clone(), config.clone(), data.clone())?;
    let typ_path = PathBuf::from(&generated.typst_path);

    // 2. 目标 PDF
    let pdf_name = config
        .export
        .file_name_pattern
        .replace("{studentName}", &data.name)
        .replace("{studentId}", &data.student_id);
    let pdf_path = Path::new(&dir).join(&pdf_name);

    if pdf_path.exists() && config.export.require_file_closed {
        ensure_not_locked(&pdf_path)?;
    }

    // 3. 调用 typst
    let fonts = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("fonts");

    let args = vec![
        "compile".to_string(),
        "--font-path".to_string(),
        fonts.to_str().ok_or("Invalid font path")?.to_string(),
        "--root".to_string(),
        dir.clone(),
        typ_path.to_str().ok_or("Invalid typ path")?.to_string(),
        pdf_path.to_str().ok_or("Invalid pdf path")?.to_string(),
    ];

    let output = run_typst(&app, args).await?;
    if !output.success {
        return Err(format_typst_error(&output));
    }

    // 4. 同步生成定稿 JSON 和 TYP（学号非空时）
    let _ = snapshot_to_student_file(Path::new(&dir), &config, &data);

    if !data.student_id.trim().is_empty() {
        let typ_name = config
            .storage
            .generated_typst_name_pattern
            .replace("{studentId}", &data.student_id);
        let final_typ_path = Path::new(&dir).join(&typ_name);
        let _ = fs::copy(&generated.typst_path, &final_typ_path);
    }

    Ok(ExportResult {
        pdf_path: pdf_path.to_string_lossy().to_string(),
        file_name: pdf_name,
    })
}
