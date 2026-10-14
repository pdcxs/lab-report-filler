use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// =====================================================================
// 多语言辅助类型
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalizedString {
    pub en: String,
    pub zh: String,
}

impl LocalizedString {
    pub fn get(&self, lang: &str) -> &str {
        match lang {
            "zh" => &self.zh,
            _ => &self.en,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalizedStringList {
    pub en: Vec<String>,
    pub zh: Vec<String>,
}

impl LocalizedStringList {
    pub fn get(&self, lang: &str) -> &Vec<String> {
        match lang {
            "zh" => &self.zh,
            _ => &self.en,
        }
    }
}

// =====================================================================
// lab.json 顶层结构
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabConfig {
    pub version: String,
    pub ui: UiConfig,
    pub storage: StorageConfig,
    pub export: ExportConfig,
    pub course: CourseConfig,
    pub student: StudentConfig,
    pub typst: TypstConfig,
    pub experiments: Vec<Experiment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiConfig {
    pub default_language: String,
    pub available_languages: Vec<String>,
    pub app_title: LocalizedString,
    /// key → 文案。例如 "export" → { en: "Export PDF", zh: "导出 PDF" }
    pub strings: HashMap<String, LocalizedString>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageConfig {
    pub data_file_name_pattern: String, // report-{studentId}.json
    pub draft_file_name: String,        // report-draft.json
    pub generated_typst_name_pattern: String, // report-{studentId}.typ
    pub images_folder: String,          // images
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportConfig {
    pub file_name_pattern: String, // {studentName} - {studentId}.pdf
    pub overwrite_silently: bool,
    pub require_file_closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CourseConfig {
    pub course_name: LocalizedString,
    pub teacher_name: LocalizedString,
    pub class_name: LocalizedString,
    pub location: LocalizedString,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentConfig {
    pub name: StudentNameConfig,
    pub student_id: StudentIdConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentNameConfig {
    pub label: LocalizedString,
    pub placeholder: LocalizedString,
    pub hint: LocalizedString,
    pub min_length: usize,
    pub max_length: usize,
    pub require_cjk: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentIdConfig {
    pub label: LocalizedString,
    pub placeholder: LocalizedString,
    pub pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypstConfig {
    pub preamble: Vec<String>,
    pub experiment_section: Vec<String>,
}

// =====================================================================
// 实验
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Experiment {
    pub id: String,
    pub name: LocalizedString,
    pub objectives: LocalizedStringList,
    pub content: LocalizedStringList,
    pub record_guide: LocalizedStringList,
    pub placeholder: LocalizedString,
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

// =====================================================================
// 学生运行时数据（存 report-{studentId}.json）
// =====================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StudentData {
    pub name: String,
    pub student_id: String,
    /// labId → 该实验记录的 Typst 源码
    pub records: HashMap<String, String>,
}
