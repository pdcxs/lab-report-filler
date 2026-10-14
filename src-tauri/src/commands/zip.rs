use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};
use zip::ZipArchive;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractResult {
    pub dir: String,
    pub file_count: usize,
}

fn is_ignorable(name: &str) -> bool {
    matches!(name, ".DS_Store" | "Thumbs.db" | "desktop.ini")
}

fn is_dir_empty(path: &Path) -> Result<bool, String> {
    if !path.exists() {
        return Ok(true);
    }
    if !path.is_dir() {
        return Err("Selected path is not a directory.".into());
    }
    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if !is_ignorable(&name) {
            return Ok(false);
        }
    }
    Ok(true)
}

fn normalize_path(p: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in p.components() {
        match comp {
            Component::Prefix(x) => out.push(x.as_os_str()),
            Component::RootDir => out.push(std::path::MAIN_SEPARATOR.to_string()),
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            Component::Normal(x) => out.push(x),
        }
    }
    out
}

fn safe_join(base: &Path, name: &str) -> Result<PathBuf, String> {
    let rel = name.replace('\\', "/");
    let rel_path = Path::new(&rel);
    if rel_path.is_absolute() {
        return Err(format!("Absolute path in zip: {name}"));
    }
    let joined = base.join(rel_path);
    let normalized = normalize_path(&joined);
    let base_norm = normalize_path(base);
    if !normalized.starts_with(&base_norm) {
        return Err(format!("Zip slip detected: {name}"));
    }
    Ok(joined)
}

#[tauri::command]
pub fn extract_zip(zip_path: String, target_dir: String) -> Result<ExtractResult, String> {
    let zip_file = Path::new(&zip_path);
    if !zip_file.is_file() {
        return Err(format!("Zip not found: {zip_path}"));
    }

    let target = PathBuf::from(&target_dir);
    if !target.exists() {
        fs::create_dir_all(&target).map_err(|e| e.to_string())?;
    }
    if !is_dir_empty(&target)? {
        return Err("DIR_NOT_EMPTY".into());
    }

    let file = fs::File::open(zip_file).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut count = 0usize;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().map_err(|e| e.to_string())?.to_string();

        if name.ends_with('/') {
            let dir = safe_join(&target, &name)?;
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            continue;
        }

        let out_path = safe_join(&target, &name)?;
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut out = fs::File::create(&out_path).map_err(|e| e.to_string())?;
        io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        count += 1;
    }

    Ok(ExtractResult {
        dir: target.to_string_lossy().to_string(),
        file_count: count,
    })
}
