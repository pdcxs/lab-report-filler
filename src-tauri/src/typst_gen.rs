use crate::model::{Experiment, LabConfig, StudentData};

/// 转义 Typst 字符串字面量里的特殊字符。
/// 学生姓名一般不会带这些，但保险起见。
fn escape_str(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

/// 替换行内的简单占位符（不包含块级占位符）。
fn replace_simple(line: &str, config: &LabConfig, student: &StudentData, lang: &str) -> String {
    line.replace("{{studentName}}", &escape_str(&student.name))
        .replace("{{studentId}}", &escape_str(&student.student_id))
        .replace(
            "{{courseName}}",
            &escape_str(config.course.course_name.get(lang)),
        )
        .replace(
            "{{teacherName}}",
            &escape_str(config.course.teacher_name.get(lang)),
        )
        .replace(
            "{{className}}",
            &escape_str(config.course.class_name.get(lang)),
        )
        .replace(
            "{{location}}",
            &escape_str(config.course.location.get(lang)),
        )
}

/// 渲染实验目的（Typst 有序列表 `+ ...`）。
fn render_objectives(exp: &Experiment, lang: &str) -> String {
    exp.objectives
        .get(lang)
        .iter()
        .map(|item| format!("+ {}", item))
        .collect::<Vec<_>>()
        .join("\n")
}

/// 渲染实验内容。
/// 内容项本身可能已经带 "1. "、"- " 等前缀，所以直接拼接，不额外加列表符号。
fn render_content(exp: &Experiment, lang: &str) -> String {
    exp.content.get(lang).join("\n")
}

/// 生成完整的 Typst 源文件。
pub fn generate(config: &LabConfig, student: &StudentData, _lang: &str) -> String {
    let mut out = String::new();

    // Preamble 里目前没有语言相关的内容，用英文兜底即可。
    for line in &config.typst.preamble {
        out.push_str(&replace_simple(line, config, student, "en"));
        out.push('\n');
    }

    // 实验名称、目的、内容一律用中文，符合课程要求；
    // 学生的 recordBlock 原样保留，不做翻译。
    for exp in &config.experiments {
        for line in &config.typst.experiment_section {
            let line = replace_simple(line, config, student, "en");
            let line = line.replace("{{experimentName}}", &escape_str(&exp.name.zh));

            if line.contains("{{objectivesBlock}}") {
                out.push_str(&render_objectives(exp, "zh"));
            } else if line.contains("{{contentBlock}}") {
                out.push_str(&render_content(exp, "zh"));
            } else if line.contains("{{recordBlock}}") {
                let record = student
                    .records
                    .get(&exp.id)
                    .map(|s| s.as_str())
                    .unwrap_or("");
                out.push_str(record);
            } else {
                out.push_str(&line);
            }
            out.push('\n');
        }
    }

    out
}
