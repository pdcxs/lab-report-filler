use crate::model::{Block, LabConfig, StudentData};
use regex::Regex;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
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

/// 从文本块里收集所有 `[[X]]`，映射到实际被引用的 block 的 uid
fn referenced_uids(blocks: &[Block]) -> HashSet<String> {
    let mut exact: HashMap<String, String> = HashMap::new();
    let mut title_first: HashMap<String, String> = HashMap::new();
    for b in blocks {
        if let Some(title) = b.title() {
            if title.trim().is_empty() {
                continue;
            }
            exact.insert(format!("{}-{}", title, b.uid()), b.uid().to_string());
            title_first
                .entry(title.to_string())
                .or_insert(b.uid().to_string());
        }
    }

    let mut result = HashSet::new();
    for block in blocks {
        if let Block::Text { content, .. } = block {
            for cap in ref_bracket_re().captures_iter(content) {
                let x = &cap[1];
                if let Some(uid) = exact.get(x) {
                    result.insert(uid.clone());
                } else if let Some(uid) = title_first.get(x) {
                    result.insert(uid.clone());
                }
            }
        }
    }
    result
}

/// 有 title 但未被任何引用覆盖的 block
fn unreferenced_titles(blocks: &[Block]) -> Vec<String> {
    let refs = referenced_uids(blocks);
    blocks
        .iter()
        .filter_map(|b| {
            if let Some(title) = b.title() {
                if !title.trim().is_empty() && !refs.contains(b.uid()) {
                    Some(title.to_string())
                } else {
                    None
                }
            } else {
                None
            }
        })
        .collect()
}

/// 引用了不存在的 title（含 title-uid 形式）
fn dangling_titles(blocks: &[Block]) -> Vec<String> {
    let mut titles: HashSet<String> = HashSet::new();
    let mut exact: HashSet<String> = HashSet::new();
    for b in blocks {
        if let Some(t) = b.title() {
            if t.trim().is_empty() {
                continue;
            }
            titles.insert(t.to_string());
            exact.insert(format!("{}-{}", t, b.uid()));
        }
    }

    let mut seen: HashSet<String> = HashSet::new();
    let mut result: Vec<String> = Vec::new();
    for block in blocks {
        if let Block::Text { content, .. } = block {
            for cap in ref_bracket_re().captures_iter(content) {
                let x = cap[1].to_string();
                if !titles.contains(&x) && !exact.contains(&x) && seen.insert(x.clone()) {
                    result.push(x);
                }
            }
        }
    }
    result
}

/// 同名 block 被 `[[title]]` 引用（歧义）
fn ambiguous_titles(blocks: &[Block]) -> Vec<String> {
    let mut title_counts: HashMap<String, usize> = HashMap::new();
    let mut exact_keys: HashSet<String> = HashSet::new();
    for b in blocks {
        if let Some(t) = b.title() {
            if t.trim().is_empty() {
                continue;
            }
            *title_counts.entry(t.to_string()).or_insert(0) += 1;
            exact_keys.insert(format!("{}-{}", t, b.uid()));
        }
    }

    let mut result: HashSet<String> = HashSet::new();
    for block in blocks {
        if let Block::Text { content, .. } = block {
            for cap in ref_bracket_re().captures_iter(content) {
                let x = cap[1].to_string();
                if exact_keys.contains(&x) {
                    continue;
                }
                if title_counts.get(&x).copied().unwrap_or(0) > 1 {
                    result.insert(x);
                }
            }
        }
    }
    result.into_iter().collect()
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

        if count_code(blocks) < rules.min_code_blocks {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "min_code_blocks".into(),
                extra: Some(rules.min_code_blocks),
                label: None,
            });
        }
        if count_figures(blocks) < rules.min_figures {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "min_figures".into(),
                extra: Some(rules.min_figures),
                label: None,
            });
        }
        if count_text(blocks) < rules.min_text_blocks {
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

        if rules.require_all_referenced {
            for title in unreferenced_titles(blocks) {
                issues.push(ValidationIssue {
                    lab_id: exp.id.clone(),
                    kind: "unreferenced".into(),
                    extra: None,
                    label: Some(title),
                });
            }
        }

        for title in ambiguous_titles(blocks) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "ambiguous_ref".into(),
                extra: None,
                label: Some(title),
            });
        }

        for title in dangling_titles(blocks) {
            issues.push(ValidationIssue {
                lab_id: exp.id.clone(),
                kind: "dangling_ref".into(),
                extra: None,
                label: Some(title),
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
