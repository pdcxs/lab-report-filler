use crate::model::{LabConfig, StudentData};

fn escape_str(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn replace_simple(line: &str, config: &LabConfig, student: &StudentData) -> String {
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
}

pub fn generate(config: &LabConfig, student: &StudentData) -> String {
    let mut out = String::new();

    // 根据 lab.json 的 language 设置 Typst 文本语言，影响断行、标点挤压等规则
    if config.language == "zh" {
        out.push_str("#set text(lang: \"zh\")\n");
    }

    for line in &config.typst.preamble {
        out.push_str(&replace_simple(line, config, student));
        out.push('\n');
    }

    for exp in &config.experiments {
        for line in &config.typst.experiment_section {
            let line = replace_simple(line, config, student);
            let line = line
                .replace("{{experimentName}}", &escape_str(&exp.name))
                .replace("{{instrument}}", &exp.instrument);

            if line.contains("{{objectivesBlock}}") {
                out.push_str(&exp.objectives);
            } else if line.contains("{{contentBlock}}") {
                out.push_str(&exp.content);
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
