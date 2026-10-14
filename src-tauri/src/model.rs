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
    pub example: String,
    pub validation: ValidationRules,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationRules {
    pub require_code_block: bool,
    pub require_figure: bool,
    pub require_figure_reference: bool,
    pub min_prose_chars: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LabelInfo {
    pub label: String,
    /// "figure" | "code"
    pub kind: String,
    pub title: String,
}

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
    #[serde(default)]
    pub records: HashMap<String, String>,
    #[serde(default)]
    pub labels: HashMap<String, Vec<LabelInfo>>,
}
