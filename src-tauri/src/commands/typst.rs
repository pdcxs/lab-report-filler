use crate::model::{LabConfig, StudentData};
use crate::typst_gen;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedTypst {
    pub typst_path: String,
    pub source: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResult {
    /// 每一页的 SVG 字符串（按页码顺序）。
    pub pages: Vec<String>,
}

fn fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    // dev 与 prod 下 resource dir 都指向包含 fonts/ 的目录。
    let dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot resolve resource dir: {e}"))?;
    Ok(dir.join("fonts"))
}

/// 生成 Typst 源码并写入 report-{studentId}.typ，返回路径与源码。
#[tauri::command]
pub fn generate_typst(
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<GeneratedTypst, String> {
    let source = typst_gen::generate(&config, &data);
    let file_name = config
        .storage
        .generated_typst_name_pattern
        .replace("{studentId}", &data.student_id);
    let path = Path::new(&dir).join(&file_name);
    fs::write(&path, &source).map_err(|e| e.to_string())?;
    Ok(GeneratedTypst {
        typst_path: path.to_string_lossy().to_string(),
        source,
    })
}

/// 编译为 SVG 用于预览。
#[tauri::command]
pub async fn compile_preview(
    app: AppHandle,
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<PreviewResult, String> {
    // 1. 生成 typ
    let generated = generate_typst(dir.clone(), config, data)?;
    let typ_path = PathBuf::from(&generated.typst_path);

    // 2. 准备临时输出目录
    let preview_dir = std::env::temp_dir().join("lab-report-preview");
    if preview_dir.exists() {
        fs::remove_dir_all(&preview_dir).ok();
    }
    fs::create_dir_all(&preview_dir).map_err(|e| e.to_string())?;
    let out_pattern = preview_dir.join("page-{p}.svg");

    // 3. 调 sidecar
    let fonts = fonts_dir(&app)?;
    let sidecar = app
        .shell()
        .sidecar("typst")
        .map_err(|e| format!("sidecar not found: {e}"))?;
    let output = sidecar
        .args([
            "compile",
            "--font-path",
            fonts.to_str().ok_or("Invalid font path")?,
            "--format",
            "svg",
            "--root",
            &dir,
            typ_path.to_str().ok_or("Invalid typ path")?,
            out_pattern.to_str().ok_or("Invalid out path")?,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Typst compile failed:\n{stderr}"));
    }

    // 4. 收集页面
    let mut pages: Vec<(u32, String)> = Vec::new();
    for entry in fs::read_dir(&preview_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if let Some(num) = name
            .strip_prefix("page-")
            .and_then(|s| s.strip_suffix(".svg"))
            .and_then(|s| s.parse::<u32>().ok())
        {
            let svg = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
            pages.push((num, svg));
        }
    }
    pages.sort_by_key(|(n, _)| *n);

    Ok(PreviewResult {
        pages: pages.into_iter().map(|(_, svg)| svg).collect(),
    })
}

// 避免未使用告警；将来加"只预览当前实验"时用得上。
#[allow(dead_code)]
fn _unused() {
    let _ = OnceLock::<()>::new();
}
