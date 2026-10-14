use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedImage {
    pub relative_path: String,
    pub file_name: String,
}

#[tauri::command]
pub fn import_image(dir: String, src_path: String) -> Result<ImportedImage, String> {
    let src = PathBuf::from(&src_path);
    if !src.is_file() {
        return Err(format!("Source file not found: {src_path}"));
    }
    let images_dir = Path::new(&dir).join("images");
    fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let file_name = src
        .file_name()
        .ok_or("Invalid source file name")?
        .to_string_lossy()
        .to_string();

    let mut dest = images_dir.join(&file_name);
    if dest.exists() {
        let stem = src.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
        let ext = src.extension().and_then(|s| s.to_str()).unwrap_or("png");
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_secs();
        let new_name = format!("{stem}-{ts}.{ext}");
        dest = images_dir.join(&new_name);
        return copy_and_return(&src, &dest);
    }
    copy_and_return(&src, &dest)
}

fn copy_and_return(src: &Path, dest: &Path) -> Result<ImportedImage, String> {
    fs::copy(src, dest).map_err(|e| e.to_string())?;
    let file_name = dest
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(ImportedImage {
        relative_path: format!("images/{file_name}"),
        file_name,
    })
}
