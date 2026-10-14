#import "@preview/pointless-size:0.1.1": zh
#import "@preview/cuti:0.3.0": show-cn-fakebold
#import "utils/utils.typ": cover
#import "@preview/codly:1.3.0": codly-init

#show: show-cn-fakebold
#show: codly-init

#set page(
  margin: (top: 2.54cm, bottom: 2.54cm, left: 3.18cm, right: 3.18cm),
  paper: "a4",
)

#let your-name = "{{studentName}}"
#let your-id = "{{studentId}}"

{{experimentSections}}
