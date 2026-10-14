use crate::model::{LabConfig, StudentData};
use regex::Regex;
use serde::Serialize;
use std::sync::OnceLock;

fn label_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"<([a-zA-Z][a-zA-Z0-9_\-:.]*)>").unwrap())
}

fn ref_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"@([a-zA-Z][a-zA-Z0-9_\-:.]*)").unwrap())
}

fn code_block_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?s)```.*?```").unwrap())
}

fn command_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"#[^\s\n]+").unwrap())
}

fn has_code_block(s: &str) -> bool {
    code_block_re().is_match(s)
}

fn has_figure(s: &str) -> bool {
    s.contains("image(") || s.contains("#figure(")
}

/// 要求：至少有一个 `<label>` 且正文里至少有一个对应的 `@label`。
fn has_figure_reference(s: &str) -> bool {
    let labels: Vec<_> = label_re()
        .captures_iter(s)
        .filter_map(|c| c.get(1).map(|m| m.as_str().to_string()))
        .collect();
    if labels.is_empty() {
        return false;
    }
    let refs: Vec<_> = ref_re()
        .captures_iter(s)
        .filter_map(|c| c.get(1).map(|m| m.as_str().to_string()))
        .collect();
    labels.iter().any(|l| refs.iter().any(|r| r == l))
}

/// 去掉代码块和 Typst 命令后，剩下的非空白字符数量。
fn prose_chars(s: &str) -> usize {
    let no_code = code_block_re().replace_all(s, "");
    let no_cmd = command_re().replace_all(&no_code, "");
    no_cmd.chars().filter(|c| !c.is_whitespace()).count()
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub lab_id: String,
    /// "code_block" | "figure" | "figure_reference" | "prose"
    pub kind: String,
    /// 仅在 "prose" 时使用：说明需要多少字符。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationReport {
    pub passed: bool,
    /// "name" | "student_id" | 具体 labId + kind
    pub global_errors: Vec<String>,
    pub issues: Vec<ValidationIssue>,
}

#[tauri::command]
pub fn validate_report(config: LabConfig, data: StudentData) -> Result<ValidationReport, String> {
    let mut global_errors = Vec::new();

    if data.name.trim().is_empty() {
        global_errors.push("missing_name".into());
    } else if config.student.name.require_cjk && !data.name.chars().any(is_cjk) {
        global_errors.push("invalid_name".into());
    }

    if data.student_id.trim().is_empty() {
        global_errors.push("missing_id".into());
    } else {
        let re = Regex::new(&config.student.student_id.pattern)
            .map_err(|e| format!("Bad studentId pattern: {e}"))?;
        if !re.is_match(&data.student_id) {
            global_errors.push("invalid_id".into());
        }
    }

    let mut issues = Vec::new();
    for exp in &config.experiments {
        let content = data.records.get(&exp.id).map(|s| s.as_str()).unwrap_or("");
        let rules = &exp.validation;

        if rules.require_code_block && !has_code_block(content) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "code_block".into(),
                extra: None,
            });
        }
        if rules.require_figure && !has_figure(content) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "figure".into(),
                extra: None,
            });
        }
        if rules.require_figure_reference && !has_figure_reference(content) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "figure_reference".into(),
                extra: None,
            });
        }
        if prose_chars(content) < rules.min_prose_chars {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "prose".into(),
                extra: Some(rules.min_prose_chars),
            });
        }
    }

    let passed = global_errors.is_empty() && issues.is_empty();
    Ok(ValidationReport {
        passed,
        global_errors,
        issues,
    })
}

fn is_cjk(c: char) -> bool {
    let cp = c as u32;
    (0x4E00..=0x9FFF).contains(&cp)
        || (0x3400..=0x4DBF).contains(&cp)
        || (0x20000..=0x2A6DF).contains(&cp)
        || (0xF900..=0xFAFF).contains(&cp)
}
