#import "@preview/cuti:0.3.0": show-cn-fakebold
#import "@preview/pointless-size:0.1.1": zh

#let justify-text(tail: "：", body) = {
  stack(dir: ltr, spacing: 1fr, ..body.split("").filter(it => it != ""))
}

#let info-key(body) = {
  set text(
    font: ("Times New Roman", "SimHei"),
    size: zh(3),
  )
  rect(
    width: 100%,
    inset: (x: 0pt, bottom: 0.5pt),
    stroke: none,
    justify-text(body),
  )
}

#let info-value(body) = {
  set align(center)
  rect(
    width: 100%,
    inset: (x: 0pt, bottom: 0.5pt),
    stroke: (bottom: 0.5pt + black),
    text(
      font: ("Times New Roman", "SimHei"),
      bottom-edge: "descender",
      size: zh(3),
      body,
    ),
  )
}

#let info-long-value(body) = {
  grid.cell(
    colspan: 3,
    info-value(body),
  )
}

#let cover(
  experiment: "实验名称",
  student-name: "学生姓名",
  student-id: "学号",
  class-name: "班级名称",
  lecture-name: "课程名称",
  teacher-name: "指导教师",
  experiment-location: "实验地点",
  date: datetime.today(),
) = {
  pagebreak(weak: true)
  set page(numbering: none)

  set align(center)

  v(130pt - 1.7cm)
  image("../imgs/tyut-logo.jpg", width: 12.11cm)
  v(70pt)

  text(
    size: 30pt,
    font: ("Times New Roman", "KaiTi"),
    weight: "bold",
  )[实验报告]

  v(20pt)

  block(
    width: 318pt,
    grid(
      columns: (72pt, 1fr, 72pt, 1fr),
      column-gutter: 10pt,
      row-gutter: 20pt,
      info-key("课程名称"), info-long-value(lecture-name), info-key("实验项目"), info-long-value(experiment),
      info-key("实验地点"), info-long-value(experiment-location), info-key("学生姓名"), info-long-value(student-name),
      info-key("学　　号"), info-long-value(student-id), info-key("学生班级"), info-long-value(class-name),
      info-key("指导教师"), info-long-value(teacher-name),
    ),
  )

  v(40pt)
  text(
    font: ("Times New Roman", "KaiTi"),
    size: zh(3),
    date.display("[year]年[month]月[day]日"),
  )
}
