use crate::model::{Block, LabConfig, StudentData};
use std::collections::{HashMap, HashSet};

fn escape_str(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn replace_simple(
    line: &str,
    config: &LabConfig,
    student: &StudentData,
    date_line: &str,
) -> String {
    let class_name = if student.class_name.trim().is_empty() {
        config.course.class_name.as_str()
    } else {
        student.class_name.as_str()
    };
    let location = if student.location.trim().is_empty() {
        config.course.location.as_str()
    } else {
        student.location.as_str()
    };

    line.replace("{{studentName}}", &escape_str(&student.name))
        .replace("{{studentId}}", &escape_str(&student.student_id))
        .replace("{{courseName}}", &escape_str(&config.course.course_name))
        .replace("{{teacherName}}", &escape_str(&config.course.teacher_name))
        .replace("{{className}}", &escape_str(class_name))
        .replace("{{location}}", &escape_str(location))
        .replace("{{dateLine}}", date_line)
}

// =====================================================================
// 文本块处理
// =====================================================================

/// 处理文本块：
/// - `[[title]]` → `@label`（title 有效时），否则转义为 `\[\[title\]\]`
/// - 转义 `\` `#` `[` `]` `//` `@`（无效 @ 时）
/// - 每个 `\n` → `\n\n`
fn process_text(
    content: &str,
    title_to_label: &HashMap<String, String>,
    valid_labels: &HashSet<String>,
) -> String {
    let mut out = String::new();
    let chars: Vec<char> = content.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        // 优先匹配 [[title]]
        if i + 1 < chars.len() && chars[i] == '[' && chars[i + 1] == '[' {
            if let Some(end) = find_closing_brackets(&chars, i + 2) {
                let title: String = chars[i + 2..end].iter().collect();
                if let Some(label) = title_to_label.get(&title) {
                    out.push('@');
                    out.push_str(label);
                    i = end + 2;
                    continue;
                }
                // title 无效：按字面量输出（转义）
                out.push_str("\\[\\[");
                i += 2;
                continue;
            }
        }

        let c = chars[i];
        match c {
            '\\' => {
                out.push_str("\\\\");
                i += 1;
            }
            '#' => {
                out.push_str("\\#");
                i += 1;
            }
            '[' => {
                out.push_str("\\[");
                i += 1;
            }
            ']' => {
                out.push_str("\\]");
                i += 1;
            }
            '/' if i + 1 < chars.len() && chars[i + 1] == '/' => {
                out.push_str("\\/\\/");
                i += 2;
            }
            '@' => {
                let mut j = i + 1;
                while j < chars.len()
                    && (chars[j].is_alphanumeric() || chars[j] == '-' || chars[j] == '_')
                {
                    j += 1;
                }
                let label: String = chars[i + 1..j].iter().collect();
                if valid_labels.contains(&label) {
                    out.push('@');
                    out.push_str(&label);
                } else {
                    out.push_str("\\@");
                    out.push_str(&label);
                }
                i = j;
            }
            '\n' => {
                out.push_str("\n\n");
                i += 1;
            }
            _ => {
                out.push(c);
                i += 1;
            }
        }
    }

    out
}

fn find_closing_brackets(chars: &[char], start: usize) -> Option<usize> {
    let mut i = start;
    while i + 1 < chars.len() {
        if chars[i] == ']' && chars[i + 1] == ']' {
            return Some(i);
        }
        i += 1;
    }
    None
}

fn strip_math_delims(s: &str) -> String {
    let t = s.trim();
    let t = t.strip_prefix('$').unwrap_or(t);
    let t = t.strip_suffix('$').unwrap_or(t);
    t.trim().to_string()
}

// =====================================================================
// Block 渲染
// =====================================================================

fn render_blocks(blocks: &[Block]) -> String {
    let title_to_label: HashMap<String, String> = blocks
        .iter()
        .filter_map(|b| b.title().map(|t| t.to_string()).zip(b.label()))
        .collect();
    let valid_labels: HashSet<String> = title_to_label.values().cloned().collect();

    let mut out = String::new();
    for block in blocks {
        match block {
            Block::Text { content, .. } => {
                let processed = process_text(content, &title_to_label, &valid_labels);
                out.push('\n');
                out.push_str(&processed);
                out.push('\n');
            }
            Block::Image {
                title,
                relative_path,
                width,
                ..
            } => {
                let label = format!("fig-{:08x}", fnv1a(title));
                out.push_str(&format!(
                    "\n#figure(\n  image(\"{}\", width: {}%),\n  caption: \"{}\",\n) <{}>\n",
                    relative_path,
                    width,
                    escape_str(title),
                    label
                ));
            }
            Block::Code {
                title,
                language,
                code,
                ..
            } => {
                let label = format!("code-{:08x}", fnv1a(title));
                out.push_str(&format!(
                    "\n#figure(\n  caption: \"{}\",\n)[\n```{}\n{}\n```\n] <{}>\n",
                    escape_str(title),
                    language,
                    code.trim_end(),
                    label
                ));
            }
            Block::Math { title, formula, .. } => {
                let f = strip_math_delims(formula);
                if title.trim().is_empty() {
                    // 无 label：普通块公式，Typography 会自动居中
                    out.push_str(&format!("\n$ {} $\n", f));
                } else {
                    // 有 label：加编号锚点，供 @eq-xxx 引用
                    let label = format!("eq-{:08x}", fnv1a(title));
                    out.push_str(&format!("\n$ {} $ <{}>\n", f, label));
                }
            }
        }
    }
    out
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
// 日期
// =====================================================================

fn date_line_for(exp_id: &str, student: &StudentData) -> String {
    match student.dates.get(exp_id).and_then(|x| x.as_ref()) {
        Some(d) => {
            let parts: Vec<&str> = d.split('-').collect();
            if parts.len() == 3 {
                let y = parts[0];
                let m = parts[1].parse::<u8>().unwrap_or(1);
                let day = parts[2].parse::<u8>().unwrap_or(1);
                format!("  date: datetime(year: {}, month: {}, day: {}),", y, m, day)
            } else {
                String::new()
            }
        }
        None => String::new(),
    }
}

// =====================================================================
// 主入口
// =====================================================================

pub fn generate(config: &LabConfig, student: &StudentData) -> String {
    let mut out = String::new();

    if config.language == "zh" {
        out.push_str("#set text(lang: \"zh\")\n");
    }

    for line in &config.typst.preamble {
        out.push_str(&replace_simple(line, config, student, ""));
        out.push('\n');
    }

    for exp in &config.experiments {
        let date_line = date_line_for(&exp.id, student);
        let empty: Vec<Block> = Vec::new();
        let blocks = student.records.get(&exp.id).unwrap_or(&empty);
        let record = render_blocks(blocks);

        for line in &config.typst.experiment_section {
            let line = replace_simple(line, config, student, &date_line);
            let line = line
                .replace("{{experimentName}}", &escape_str(&exp.name))
                .replace("{{instrument}}", &exp.instrument);

            if line.contains("{{objectivesBlock}}") {
                out.push_str(&exp.objectives);
            } else if line.contains("{{contentBlock}}") {
                out.push_str(&exp.content);
            } else if line.contains("{{recordBlock}}") {
                out.push_str(&record);
            } else {
                out.push_str(&line);
            }
            out.push('\n');
        }
    }

    out
}
