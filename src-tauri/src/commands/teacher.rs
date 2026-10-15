use crate::commands::typst::{format_typst_error, run_typst};
use crate::model::LabConfig;
use crate::model::StudentData;
use crate::typst_gen;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_UTILS_TYP: &str = include_str!("../../resources/utils.typ");

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TeacherExportResult {
    pub zip_path: String,
}

// =====================================================================
// 路径辅助
// =====================================================================

fn fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot resolve resource dir: {e}"))?;
    Ok(dir.join("fonts"))
}

/// 定位内置的默认 logo。
/// 生产环境从 resource_dir 找；开发环境回退到源码目录。
fn default_logo_path(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(res) = app.path().resource_dir() {
        for cand in [
            res.join("resources").join("imgs").join("tyut-logo.jpg"),
            res.join("imgs").join("tyut-logo.jpg"),
        ] {
            if cand.exists() {
                return Ok(cand);
            }
        }
    }
    let dev = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("resources")
        .join("imgs")
        .join("tyut-logo.jpg");
    if dev.exists() {
        return Ok(dev);
    }
    Err("Default logo not found in resources".into())
}

/// 把用户提供的 logo（或内置默认 logo）复制到 dest。
fn copy_logo(app: &AppHandle, dest: &Path, user_provided: Option<String>) -> Result<(), String> {
    if let Some(p) = user_provided {
        let src = PathBuf::from(&p);
        if !src.is_file() {
            return Err(format!("Logo file not found: {p}"));
        }
        fs::copy(&src, dest).map_err(|e| e.to_string())?;
    } else {
        let default = default_logo_path(app)?;
        fs::copy(&default, dest).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// =====================================================================
// 导出
// =====================================================================

#[tauri::command]
pub fn teacher_export(
    app: AppHandle,
    zip_path: String,
    config: LabConfig,
    logo_path: Option<String>,
) -> Result<TeacherExportResult, String> {
    // 1. 在临时目录里搭好结构
    let tmp = std::env::temp_dir().join(format!("lab-report-package-{}", std::process::id()));
    if tmp.exists() {
        fs::remove_dir_all(&tmp).ok();
    }
    fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;

    // lab.json
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(tmp.join("lab.json"), json).map_err(|e| e.to_string())?;

    // utils/utils.typ
    let utils_dir = tmp.join("utils");
    fs::create_dir_all(&utils_dir).map_err(|e| e.to_string())?;
    fs::write(utils_dir.join("utils.typ"), DEFAULT_UTILS_TYP).map_err(|e| e.to_string())?;

    // imgs/tyut-logo.jpg
    let imgs_dir = tmp.join("imgs");
    fs::create_dir_all(&imgs_dir).map_err(|e| e.to_string())?;
    copy_logo(&app, &imgs_dir.join("tyut-logo.jpg"), logo_path)?;

    // 2. 打包
    create_zip_archive(&tmp, Path::new(&zip_path))?;

    // 3. 清理临时目录
    fs::remove_dir_all(&tmp).ok();

    Ok(TeacherExportResult { zip_path })
}

// =====================================================================
// 教师实时预览
// =====================================================================

#[tauri::command]
pub async fn preview_teacher_config(
    app: AppHandle,
    config: LabConfig,
    logo_path: Option<String>,
) -> Result<Vec<String>, String> {
    // 1. 准备临时目录
    let tmp = std::env::temp_dir().join("lab-report-teacher-preview");
    if tmp.exists() {
        fs::remove_dir_all(&tmp).ok();
    }
    fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;

    // 2. utils/utils.typ
    let utils_dir = tmp.join("utils");
    fs::create_dir_all(&utils_dir).map_err(|e| e.to_string())?;
    fs::write(utils_dir.join("utils.typ"), DEFAULT_UTILS_TYP).map_err(|e| e.to_string())?;

    // 3. imgs/tyut-logo.jpg
    let imgs_dir = tmp.join("imgs");
    fs::create_dir_all(&imgs_dir).map_err(|e| e.to_string())?;
    copy_logo(&app, &imgs_dir.join("tyut-logo.jpg"), logo_path)?;

    // 4. 占位学生数据
    let mut student = StudentData::default();
    student.name = "张三".into();
    student.student_id = "00000000".into();
    for exp in &config.experiments {
        student.records.insert(
            exp.id.clone(),
            format!("（学生 {} 的实验记录会显示在这里）\n", exp.name),
        );
    }

    // 5. 生成 typ
    let source = typst_gen::generate(&config, &student);
    let typ_path = tmp.join("preview.typ");
    fs::write(&typ_path, &source).map_err(|e| e.to_string())?;

    // 6. 编译为 SVG
    let out_dir = tmp.join("out");
    fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;
    let out_pattern = out_dir.join("page-{p}.svg");

    let fonts = fonts_dir(&app)?;

    let args = vec![
        "compile".to_string(),
        "--font-path".to_string(),
        fonts.to_str().ok_or("Invalid font path")?.to_string(),
        "--format".to_string(),
        "svg".to_string(),
        "--root".to_string(),
        tmp.to_str().ok_or("Invalid root")?.to_string(),
        typ_path.to_str().ok_or("Invalid typ path")?.to_string(),
        out_pattern.to_str().ok_or("Invalid out path")?.to_string(),
    ];

    let output = run_typst(&app, args).await?;
    if !output.success {
        return Err(format_typst_error(&output));
    }

    // 7. 收集页面
    let mut pages: Vec<(u32, String)> = Vec::new();
    for entry in fs::read_dir(&out_dir).map_err(|e| e.to_string())? {
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

    Ok(pages.into_iter().map(|(_, svg)| svg).collect())
}

// =====================================================================
// ZIP 打包
// =====================================================================

fn create_zip_archive(src_dir: &Path, dest: &Path) -> Result<(), String> {
    let file = fs::File::create(dest).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    add_dir_recursive(&mut zip, src_dir, src_dir, options)?;
    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

fn add_dir_recursive(
    zip: &mut zip::ZipWriter<fs::File>,
    base: &Path,
    current: &Path,
    options: zip::write::SimpleFileOptions,
) -> Result<(), String> {
    for entry in fs::read_dir(current).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let rel = path
            .strip_prefix(base)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");

        if path.is_dir() {
            zip.add_directory(format!("{rel}/"), options)
                .map_err(|e| e.to_string())?;
            add_dir_recursive(zip, base, &path, options)?;
        } else {
            zip.start_file(&rel, options).map_err(|e| e.to_string())?;
            let mut f = fs::File::open(&path).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, zip).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
