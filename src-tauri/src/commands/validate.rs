use crate::model::{Block, LabConfig, StudentData};
use regex::Regex;
use serde::Serialize;
use std::collections::HashSet;
use std::sync::OnceLock;

fn ref_bracket_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\[\[([^\]]+)\]\]").unwrap())
}

fn has_code_block(blocks: &[Block]) -> bool {
    blocks.iter().any(|b| matches!(b, Block::Code { .. }))
}

fn has_figure(blocks: &[Block]) -> bool {
    blocks.iter().any(|b| matches!(b, Block::Image { .. }))
}

/// 从所有文本块中提取 `[[title]]` 引用
fn collect_refs(blocks: &[Block]) -> HashSet<String> {
    let mut refs = HashSet::new();
    for block in blocks {
        if let Block::Text { content, .. } = block {
            for cap in ref_bracket_re().captures_iter(content) {
                refs.insert(cap[1].to_string());
            }
        }
    }
    refs
}

/// 所有可引用的 title 集合（图片/代码/公式）
fn collect_titles(blocks: &[Block]) -> HashSet<String> {
    blocks
        .iter()
        .filter_map(|b| b.title().map(|s| s.to_string()))
        .collect()
}

fn prose_chars(blocks: &[Block]) -> usize {
    blocks
        .iter()
        .filter_map(|b| {
            if let Block::Text { content, .. } = b {
                Some(content.chars().filter(|c| !c.is_whitespace()).count())
            } else {
                None
            }
        })
        .sum()
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub lab_id: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationReport {
    pub passed: bool,
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
        let empty: Vec<Block> = Vec::new();
        let blocks = data.records.get(&exp.id).unwrap_or(&empty);
        let rules = &exp.validation;

        if rules.require_code_block && !has_code_block(blocks) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "code_block".into(),
                extra: None,
                label: None,
            });
        }
        if rules.require_figure && !has_figure(blocks) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "figure".into(),
                extra: None,
                label: None,
            });
        }

        // 未引用的 card（有 title 但正文没 [[title]]）
        let refs = collect_refs(blocks);
        for title in collect_titles(blocks) {
            if !refs.contains(&title) {
                issues.push(ValidationIssue {
                    lab_id: exp.id.clone(),
                    kind: "unreferenced".into(),
                    extra: None,
                    label: Some(title),
                });
            }
        }

        // 引用了但不存在的 card
        let titles = collect_titles(blocks);
        for r in &refs {
            if !titles.contains(r) {
                issues.push(ValidationIssue {
                    lab_id: exp.id.clone(),
                    kind: "dangling_ref".into(),
                    extra: None,
                    label: Some(r.clone()),
                });
            }
        }

        if prose_chars(blocks) < rules.min_prose_chars {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "prose".into(),
                extra: Some(rules.min_prose_chars),
                label: None,
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
