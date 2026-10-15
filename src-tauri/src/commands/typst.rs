use crate::model::{LabConfig, StudentData};
use crate::typst_gen;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
#[cfg(not(target_os = "linux"))]
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
    pub pages: Vec<String>,
}

// =====================================================================
// 统一的 Typst 调用接口
// =====================================================================

pub struct TypstOutput {
    pub success: bool,
    pub code: Option<i32>,
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TypstCheck {
    pub available: bool,
    pub version: Option<String>,
    pub message: Option<String>,
}

/// 检测系统里是否有可用的 typst。
/// - Windows / macOS：检测内置 sidecar 是否能跑。
/// - Linux：检测系统 PATH 里的 `typst`。
#[tauri::command]
pub async fn check_typst(app: AppHandle) -> Result<TypstCheck, String> {
    let output = run_typst(&app, vec!["--version".to_string()]).await;

    match output {
        Ok(o) if o.success => {
            let stdout = String::from_utf8_lossy(&o.stdout).trim().to_string();
            Ok(TypstCheck {
                available: true,
                version: Some(stdout),
                message: None,
            })
        }
        Ok(o) => {
            let stderr = String::from_utf8_lossy(&o.stderr).trim().to_string();
            Ok(TypstCheck {
                available: false,
                version: None,
                message: Some(if stderr.is_empty() {
                    format!("typst exited with code {:?}", o.code)
                } else {
                    stderr
                }),
            })
        }
        Err(e) => Ok(TypstCheck {
            available: false,
            version: None,
            message: Some(e),
        }),
    }
}

/// Windows / macOS：调用 Tauri 打包的 sidecar。
/// Linux：调用系统 PATH 里的 typst（用户自行安装）。
#[cfg_attr(target_os = "linux", allow(unused_variables))]
pub async fn run_typst(app: &AppHandle, args: Vec<String>) -> Result<TypstOutput, String> {
    #[cfg(target_os = "linux")]
    {
        let args_owned = args.clone();
        let output = tauri::async_runtime::spawn_blocking(move || {
            std::process::Command::new("typst")
                .args(&args_owned)
                .output()
        })
        .await
        .map_err(|e| format!("Task join error: {e}"))?
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Typst is not installed on this system. Please install it first.\n\
                 - Arch Linux: sudo pacman -S typst\n\
                 - Ubuntu / Debian: sudo apt install typst (or: cargo install typst-cli)\n\
                 - Any system with Rust: cargo install typst-cli"
                    .to_string()
            } else {
                format!("Failed to run typst: {e}")
            }
        })?;

        return Ok(TypstOutput {
            success: output.status.success(),
            code: output.status.code(),
            stdout: output.stdout,
            stderr: output.stderr,
        });
    }

    #[cfg(not(target_os = "linux"))]
    {
        let sidecar = app
            .shell()
            .sidecar("typst")
            .map_err(|e| format!("sidecar not found: {e}"))?;
        let output = sidecar
            .args(args)
            .output()
            .await
            .map_err(|e| format!("Failed to spawn typst sidecar: {e}"))?;

        return Ok(TypstOutput {
            success: output.status.success(),
            code: output.status.code(),
            stdout: output.stdout,
            stderr: output.stderr,
        });
    }
}

/// 统一的错误格式化。给 export.rs 和 teacher.rs 共用。
pub fn format_typst_error(output: &TypstOutput) -> String {
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let code_str = match output.code {
        Some(c) => format!("exit code {c}"),
        None => "killed by signal".to_string(),
    };
    let mut parts = vec![format!("Typst compile failed ({code_str}).")];
    if !stdout.trim().is_empty() {
        parts.push(format!("--- stdout ---\n{stdout}"));
    }
    if !stderr.trim().is_empty() {
        parts.push(format!("--- stderr ---\n{stderr}"));
    }
    if stdout.trim().is_empty() && stderr.trim().is_empty() {
        parts.push("No output from the typst process.".to_string());
    }
    parts.join("\n")
}

// =====================================================================
// 路径
// =====================================================================

fn fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot resolve resource dir: {e}"))?;
    Ok(dir.join("fonts"))
}

// =====================================================================
// Commands
// =====================================================================

#[tauri::command]
pub fn generate_typst(
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<GeneratedTypst, String> {
    let source = typst_gen::generate(&config, &data);
    let file_name = if data.student_id.trim().is_empty() {
        "report-draft.typ".to_string()
    } else {
        config
            .storage
            .generated_typst_name_pattern
            .replace("{studentId}", &data.student_id)
    };
    let path = Path::new(&dir).join(&file_name);
    fs::write(&path, &source).map_err(|e| e.to_string())?;
    Ok(GeneratedTypst {
        typst_path: path.to_string_lossy().to_string(),
        source,
    })
}

#[tauri::command]
pub async fn compile_preview(
    app: AppHandle,
    dir: String,
    config: LabConfig,
    data: StudentData,
) -> Result<PreviewResult, String> {
    let generated = generate_typst(dir.clone(), config, data)?;
    let typ_path = PathBuf::from(&generated.typst_path);

    let preview_dir = std::env::temp_dir().join("lab-report-preview");
    if preview_dir.exists() {
        fs::remove_dir_all(&preview_dir).ok();
    }
    fs::create_dir_all(&preview_dir).map_err(|e| e.to_string())?;
    let out_pattern = preview_dir.join("page-{p}.svg");

    let fonts = fonts_dir(&app)?;
    let args = vec![
        "compile".to_string(),
        "--font-path".to_string(),
        fonts.to_str().ok_or("Invalid font path")?.to_string(),
        "--format".to_string(),
        "svg".to_string(),
        "--root".to_string(),
        dir.clone(),
        typ_path.to_str().ok_or("Invalid typ path")?.to_string(),
        out_pattern.to_str().ok_or("Invalid out path")?.to_string(),
    ];

    let output = run_typst(&app, args).await?;
    if !output.success {
        return Err(format_typst_error(&output));
    }

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
