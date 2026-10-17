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
    // title-uid 精确 → 唯一 block；title → 可能多个
    // [[X]] 解析：优先精确匹配 title-uid，否则 title 匹配第一个
    let mut exact_map: HashMap<String, String> = HashMap::new();
    let mut title_map: HashMap<String, Vec<String>> = HashMap::new();
    for b in blocks {
        if let (Some(title), Some(label)) = (b.title(), b.label()) {
            let key = format!("{}-{}", title, b.uid());
            exact_map.insert(key, label.clone());
            title_map
                .entry(title.to_string())
                .or_default()
                .push(label.clone());
        }
    }

    let mut title_to_label: HashMap<String, String> = HashMap::new();
    for (t, labels) in &title_map {
        if let Some(first) = labels.first() {
            title_to_label.insert(t.clone(), first.clone());
        }
    }

    let mut out = String::new();
    for block in blocks {
        match block {
            Block::Text { content, .. } => {
                let processed = process_text(content, &exact_map, &title_to_label);
                out.push('\n');
                out.push_str(&processed);
                out.push('\n');
            }
            Block::Image {
                uid,
                title,
                relative_path,
                width,
                ..
            } => {
                let label = format!("fig-{:08x}", fnv1a(uid));
                out.push_str(&format!(
                    "\n#figure(\n  image(\"{}\", width: {}%),\n  caption: \"{}\",\n) <{}>\n",
                    relative_path,
                    width,
                    escape_str(title),
                    label
                ));
            }
            Block::Code {
                uid,
                title,
                language,
                code,
                ..
            } => {
                let label = format!("code-{:08x}", fnv1a(uid));
                out.push_str(&format!(
                    "\n#figure(\n  caption: \"{}\",\n)[\n```{}\n{}\n```\n] <{}>\n",
                    escape_str(title),
                    language,
                    code.trim_end(),
                    label
                ));
            }
            Block::Math {
                uid,
                title,
                formula,
                ..
            } => {
                let f = strip_math_delims(formula);
                if title.trim().is_empty() {
                    out.push_str(&format!("\n$ {} $\n", f));
                } else {
                    let label = format!("eq-{:08x}", fnv1a(uid));
                    out.push_str(&format!("\n$ {} $ <{}>\n", f, label));
                }
            }
        }
    }
    out
}

fn process_text(
    content: &str,
    exact_map: &HashMap<String, String>,
    title_map: &HashMap<String, String>,
) -> String {
    let mut out = String::new();
    let chars: Vec<char> = content.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        if i + 1 < chars.len() && chars[i] == '[' && chars[i + 1] == '[' {
            if let Some(end) = find_closing_brackets(&chars, i + 2) {
                let x: String = chars[i + 2..end].iter().collect();
                // 优先精确 title-uid
                if let Some(label) = exact_map.get(&x) {
                    out.push('@');
                    out.push_str(label);
                    i = end + 2;
                    continue;
                }
                // 再 title
                if let Some(label) = title_map.get(&x) {
                    out.push('@');
                    out.push_str(label);
                    i = end + 2;
                    continue;
                }
                // 无效引用 → 按字面量
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
                let valid: HashSet<&String> =
                    exact_map.values().chain(title_map.values()).collect();
                if valid.contains(&label) {
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

    let has_eq_numbering = config
        .typst
        .preamble
        .iter()
        .any(|line| line.contains("math.equation") && line.contains("numbering"));
    if !has_eq_numbering {
        out.push_str("#set math.equation(numbering: \"(1)\")\n");
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
