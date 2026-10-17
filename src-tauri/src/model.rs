use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabConfig {
    pub version: String,
    pub language: String,
    pub storage: StorageConfig,
    pub export: ExportConfig,
    pub course: CourseConfig,
    pub student: StudentConfig,
    pub typst: TypstConfig,
    pub experiments: Vec<Experiment>,
    #[serde(default)]
    pub code_languages: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageConfig {
    pub data_file_name_pattern: String,
    pub draft_file_name: String,
    pub generated_typst_name_pattern: String,
    pub images_folder: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportConfig {
    pub file_name_pattern: String,
    pub overwrite_silently: bool,
    pub require_file_closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CourseConfig {
    pub course_name: String,
    pub teacher_name: String,
    pub class_name: String,
    pub location: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentConfig {
    pub name: StudentNameConfig,
    pub student_id: StudentIdConfig,
    pub class_name: SimpleFieldConfig,
    pub location: SimpleFieldConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleFieldConfig {
    pub label: String,
    pub placeholder: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentNameConfig {
    pub label: String,
    pub placeholder: String,
    pub hint: String,
    pub min_length: usize,
    pub max_length: usize,
    pub require_cjk: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentIdConfig {
    pub label: String,
    pub placeholder: String,
    pub pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypstConfig {
    pub preamble: Vec<String>,
    pub experiment_section: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Experiment {
    pub id: String,
    pub name: String,
    pub objectives: String,
    pub content: String,
    pub instrument: String,
    pub record_guide: Vec<String>,
    pub placeholder: String,
    pub validation: ValidationRules,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationRules {
    #[serde(default)]
    pub require_all_referenced: bool,
    #[serde(default)]
    pub min_code_blocks: usize,
    #[serde(default)]
    pub min_figures: usize,
    #[serde(default)]
    pub min_text_blocks: usize,
    #[serde(default)]
    pub min_prose_chars: usize,
}

// =====================================================================
// Block
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Block {
    #[serde(rename_all = "camelCase")]
    Text { uid: String, content: String },
    #[serde(rename_all = "camelCase")]
    Image {
        uid: String,
        title: String,
        relative_path: String,
        width: u8,
    },
    #[serde(rename_all = "camelCase")]
    Code {
        uid: String,
        title: String,
        language: String,
        code: String,
    },
    #[serde(rename_all = "camelCase")]
    Math {
        uid: String,
        title: String,
        formula: String,
    },
}

impl Block {
    pub fn uid(&self) -> &str {
        match self {
            Block::Text { uid, .. } => uid,
            Block::Image { uid, .. } => uid,
            Block::Code { uid, .. } => uid,
            Block::Math { uid, .. } => uid,
        }
    }

    pub fn label(&self) -> Option<String> {
        match self {
            Block::Text { .. } => None,
            Block::Image { uid, .. } => Some(format!("fig-{:08x}", fnv1a(uid))),
            Block::Code { uid, .. } => Some(format!("code-{:08x}", fnv1a(uid))),
            Block::Math { uid, title, .. } => {
                if title.trim().is_empty() {
                    None
                } else {
                    Some(format!("eq-{:08x}", fnv1a(uid)))
                }
            }
        }
    }

    pub fn title(&self) -> Option<&str> {
        match self {
            Block::Text { .. } => None,
            Block::Image { title, .. } => Some(title),
            Block::Code { title, .. } => Some(title),
            Block::Math { title, .. } => Some(title),
        }
    }
}

fn fnv1a(s: &str) -> u32 {
    let mut hash: u32 = 2166136261;
    for byte in s.bytes() {
        hash ^= byte as u32;
        hash = hash.wrapping_mul(16777619);
    }
    hash
}

// =====================================================================
// StudentData
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StudentData {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub student_id: String,
    #[serde(default)]
    pub class_name: String,
    #[serde(default)]
    pub location: String,
    /// labId → 该实验的 block 列表
    #[serde(default)]
    pub records: HashMap<String, Vec<Block>>,
    /// labId → 日期（"YYYY-MM-DD"），None 或缺失表示用 today
    #[serde(default)]
    pub dates: HashMap<String, Option<String>>,
}
