use crate::model::{Block, LabConfig, StudentData};
use regex::Regex;
use serde::Serialize;
use std::collections::HashSet;
use std::sync::OnceLock;

fn ref_bracket_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\[\[([^\]]+)\]\]").unwrap())
}

fn count_code(blocks: &[Block]) -> usize {
    blocks
        .iter()
        .filter(|b| matches!(b, Block::Code { .. }))
        .count()
}
fn count_figures(blocks: &[Block]) -> usize {
    blocks
        .iter()
        .filter(|b| matches!(b, Block::Image { .. }))
        .count()
}
fn count_text(blocks: &[Block]) -> usize {
    blocks
        .iter()
        .filter(|b| matches!(b, Block::Text { .. }))
        .count()
}

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

        let code_count = count_code(blocks);
        let figure_count = count_figures(blocks);
        let text_count = count_text(blocks);

        if code_count < rules.min_code_blocks {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "min_code_blocks".into(),
                extra: Some(rules.min_code_blocks),
                label: None,
            });
        }
        if figure_count < rules.min_figures {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "min_figures".into(),
                extra: Some(rules.min_figures),
                label: None,
            });
        }
        if text_count < rules.min_text_blocks {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "min_text_blocks".into(),
                extra: Some(rules.min_text_blocks),
                label: None,
            });
        }
        if prose_chars(blocks) < rules.min_prose_chars {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "prose".into(),
                extra: Some(rules.min_prose_chars),
                label: None,
            });
        }

        // 引用检查（可选）
        if rules.require_all_referenced {
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
        }

        // 引用了不存在的标题 → 总是检查
        let refs = collect_refs(blocks);
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
