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
                if let Some(label) = exact_map.get(&x) {
                    out.push('@');
                    out.push_str(label);
                    i = end + 2;
                    continue;
                }
                if let Some(label) = title_map.get(&x) {
                    out.push('@');
                    out.push_str(label);
                    i = end + 2;
                    continue;
                }
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
            '=' => {
                out.push_str("\\=");
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

fn strip_math_delims(s: &str) -> String {
    let mut t = s.trim();
    while let Some(r) = t.strip_prefix('$') {
        t = r.trim_start();
    }
    while let Some(r) = t.strip_suffix('$') {
        t = r.trim_end();
    }
    t.to_string()
}

fn block_needs_mitex(block: &Block) -> bool {
    matches!(block, Block::Math { format, .. } if format == "latex")
}

fn render_blocks(blocks: &[Block]) -> String {
    let mut title_to_label: HashMap<String, String> = HashMap::new();
    let mut exact_map: HashMap<String, String> = HashMap::new();
    for b in blocks {
        if let (Some(title), Some(label)) = (b.title(), b.label()) {
            if title.trim().is_empty() {
                continue;
            }
            exact_map.insert(format!("{}-{}", title, b.uid()), label.clone());
            title_to_label
                .entry(title.to_string())
                .or_insert(label.clone());
        }
    }

    let mut out = String::new();
    for block in blocks {
        match block {
            Block::Text { content, raw, .. } => {
                let processed = if *raw {
                    content.clone()
                } else {
                    process_text(content, &exact_map, &title_to_label)
                };
                out.push('\n');
                out.push_str(&processed);
                out.push('\n');
            }
            Block::Heading { level, content, .. } => {
                let marker = "=".repeat((*level).clamp(1, 6) as usize);
                let single_line = content.replace('\n', " ");
                out.push_str(&format!("\n{} {}\n", marker, single_line));
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
                format,
                ..
            } => {
                let label = if title.trim().is_empty() {
                    None
                } else {
                    Some(format!("eq-{:08x}", fnv1a(uid)))
                };

                if format == "latex" {
                    let f = strip_math_delims(formula);
                    match label {
                        Some(l) => out.push_str(&format!("\n#mitex(`{}`) <{}>\n", f, l)),
                        None => out.push_str(&format!("\n#mitex(`{}`)\n", f)),
                    }
                } else {
                    let f = strip_math_delims(formula);
                    match label {
                        Some(l) => out.push_str(&format!("\n$ {} $ <{}>\n", f, l)),
                        None => out.push_str(&format!("\n$ {} $\n", f)),
                    }
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

pub fn generate(config: &LabConfig, student: &StudentData) -> String {
    let mut out = String::new();

    // 检测是否有 LaTeX 公式，需要 import mitex
    let needs_mitex = config.experiments.iter().any(|exp| {
        student
            .records
            .get(&exp.id)
            .map_or(false, |blocks| blocks.iter().any(block_needs_mitex))
    });

    if needs_mitex {
        out.push_str("#import \"@preview/mitex:0.2.7\": *\n");
    }

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
