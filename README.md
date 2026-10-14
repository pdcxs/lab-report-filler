# Lab Report Filler

A desktop app that helps students fill in lab reports without touching Typst source code. Students edit only the fields they should (name, student ID, experiment records); the app compiles everything into a PDF using Typst.

A desktop app that helps students fill in lab reports without touching Typst source code. Students edit only the fields they should (name, student ID, experiment records); the app compiles everything into a PDF using Typst.

---

## 中文

### 简介

Lab Report Filler 是一个桌面应用，帮助学生填写实验报告，无需接触 Typst 源码。学生只能编辑该编辑的字段（中文姓名、学号、各实验记录），其余内容（实验名称、目的、要求）由老师通过 `lab.json` 定义，学生无法修改。

导出时应用会：
1. 校验姓名、学号格式；
2. 校验每个实验记录是否包含代码块、图片、图片引用和足够的文字说明；
3. 调用内置 Typst 编译器生成 PDF，文件名为 `{中文姓名} - {学号}.pdf`。

界面支持**英文 / 中文**切换，主题支持**亮色 / 暗色**切换。所有学生数据自动保存到实验目录下的 JSON 文件，无需手动保存。

### 功能特性

- 🎯 **零 Typst 门槛**：学生只填文本框，不接触 `.typ` 语法。
- 🌐 **中英双语界面**：切换按钮在右上角。
- 🌓 **亮色/暗色主题**：跟随系统或手动切换。
- 🖼️ **友好图片插入**：选图片 → 填标签和标题 → 自动复制到 `images/` 并插入 `#figure(...)`。
- 🔗 **图片引用助手**：列出当前记录中所有图片标签，一键插入 `@label`。
- 📄 **实时预览**：编辑后 800ms 自动重新编译，右侧实时显示 SVG。
- ✅ **导出前校验**：缺代码块、缺图、缺引用、说明太短都会拦截并弹窗提示。
- 💾 **自动保存**：编辑后 800ms 自动写入 JSON 文件。
- 🗂️ **目录记忆**：下次打开应用自动回到上次的实验目录。

### 系统要求

- **Windows**：Windows 10 或更高版本。
- **macOS**：macOS 11 或更高版本（Intel 和 Apple Silicon 均有独立安装包）。
- **Linux**：主流发行版（提供 AppImage 和 deb）。

### 安装

前往 [Releases](https://github.com/YOUR_USERNAME/lab-report-filler/releases) 页面，下载对应平台的安装包：

| 平台 | 推荐安装包 |
|---|---|
| Windows | `.msi` 或 `.exe` |
| macOS（Apple Silicon / M 系列） | `aarch64.dmg` |
| macOS（Intel） | `x64.dmg` |
| Linux | `.AppImage` 或 `.deb` |

**macOS 用户注意**：由于未做代码签名，首次打开时系统可能会提示"来自身份不明的开发者"。请右键点击应用 → **打开**，或前往"系统设置 → 隐私与安全性"手动允许。

### 学生使用说明

1. **打开实验目录**：启动应用后，把老师发给你的实验文件夹拖进窗口，或点击 "Open Folder" 选择。
2. **填写个人信息**：左侧填中文姓名和学号。姓名必须包含至少一个中文字符。
3. **逐个填写实验**：左侧列表切换实验，右侧上方是只读的"实验目的和要求""实验内容"，下方是你需要填写的"实验记录"。
4. **撰写记录**：
   - 点 **Show Example**（Lab 1）查看示例写法。
   - 点 **Insert Image** 插入运行结果截图（需填一个标签，比如 `fig1`）。
   - 点 **Insert Reference** 在正文里引用已有图片（插入 `@fig1`）。
   - 记录中至少要有：一个代码块、一张图、正文中对该图的引用、以及足够的文字说明。
5. **预览**：右侧实时显示最终 PDF 的样子。
6. **导出 PDF**：点右下角 **Export PDF**。若校验不通过，会弹窗告诉你缺什么。通过后会生成 `{中文姓名} - {学号}.pdf`，就在实验目录下。

### 老师使用说明

老师需要为每门课程准备一个实验目录，至少包含：

```
course-folder/
├── lab.json              ← 实验配置（必填）
├── images/               ← 学生插入的图片会放在这里
├── utils/
│   └── utils.typ         ← 封面模板
└── report-{学号}.json    ← 学生数据（自动生成）
```

**`lab.json` 结构**：可以参考仓库中 `example/lab.json` 的示例。核心字段：

- `ui`：界面文案，支持中英文。
- `course`：课程名称、教师、班级、地点。
- `student`：姓名和学号的校验规则。
- `typst`：Typst 源码模板，用 `{{...}}` 占位。
- `experiments[]`：每个实验的
  - `id`：唯一标识。
  - `name`：实验名称（中英各一份）。
  - `objectives`：实验目的（只读展示）。
  - `content`：实验内容（只读展示）。
  - `recordGuide`：学生记录里应该包含什么（可折叠面板提示）。
  - `placeholder`：编辑框为空时的占位文字。
  - `example`：示例内容（点击 Show Example 显示）。
  - `validation`：校验规则（是否需要代码块/图片/图片引用、最少文字数）。

**注意**：`content` 和 `objectives` 里的文本会被直接拼进 Typst 源码。如果文本包含 `[` `]` `$` `#` 等 Typst 特殊字符，需要用反斜杠转义（例如 `\[`），或用 `$...$` 包起来。

### 开发

```bash
# 安装依赖
npm install

# 下载 Typst sidecar（根据你的平台）
# 放到 src-tauri/binaries/ 下，命名格式见 .github/workflows/release.yml

# 开发模式
npm run tauri dev

# 构建本地安装包
npm run tauri build
```

**技术栈**：Tauri 2 + React 18 + TypeScript + Mantine 7 + Zustand。

### 发布

打 tag 后 GitHub Actions 会自动为 Windows、macOS（Intel + ARM）、Linux 构建安装包并创建 draft release：

```bash
git tag v0.1.0
git push origin v0.1.0
```

然后到 GitHub Releases 页面检查 draft，确认无误后点 Publish。

### 许可证

MIT

---

## English

### Overview

Lab Report Filler is a desktop app that helps students fill in lab reports without touching Typst source code. Students can only edit the fields they are supposed to edit (Chinese name, student ID, and experiment records). Everything else — experiment titles, objectives, and required content — is defined by the instructor in `lab.json` and is read-only.

When exporting, the app will:
1. Validate the student's name and student ID.
2. Validate that each experiment record contains a code block, a figure, a figure reference, and enough prose.
3. Invoke the bundled Typst compiler to produce a PDF named `{ChineseName} - {StudentID}.pdf`.

The UI supports **English / Chinese** and **light / dark** themes. All student data is auto-saved to a JSON file inside the lab folder — no manual save needed.

### Features

- 🎯 **Zero Typst knowledge required** — students only see text fields.
- 🌐 **Bilingual UI** — toggle in the top-right corner.
- 🌓 **Light / dark theme** — follows the system or manual toggle.
- 🖼️ **Friendly image insertion** — pick a file, give it a label and caption, and the app copies it into `images/` and inserts a `#figure(...)` block.
- 🔗 **Reference helper** — lists all figure labels in the current record and inserts `@label` on click.
- 📄 **Live preview** — recompiles 800 ms after the last edit and renders SVG pages on the right.
- ✅ **Pre-export validation** — missing code blocks, figures, references, or short prose will block the export with a clear modal.
- 💾 **Auto-save** — writes to the JSON file 800 ms after the last edit.
- 🗂️ **Folder memory** — reopens the last lab folder on next launch.

### System Requirements

- **Windows**: Windows 10 or later.
- **macOS**: macOS 11 or later (separate builds for Intel and Apple Silicon).
- **Linux**: mainstream distributions (AppImage and deb provided).

### Installation

Head to the [Releases](https://github.com/YOUR_USERNAME/lab-report-filler/releases) page and download the installer for your platform:

| Platform | Recommended installer |
|---|---|
| Windows | `.msi` or `.exe` |
| macOS (Apple Silicon / M-series) | `aarch64.dmg` |
| macOS (Intel) | `x64.dmg` |
| Linux | `.AppImage` or `.deb` |

**Note for macOS users**: The app is not code-signed. On first launch, macOS may warn that it is from an unidentified developer. Right-click the app → **Open**, or allow it in **System Settings → Privacy & Security**.

### For Students

1. **Open your lab folder**: After launching, drag the folder your instructor gave you into the window, or click **Open Folder**.
2. **Fill in your info**: Enter your Chinese name and student ID in the left panel. The name must contain at least one Chinese character.
3. **Work on each experiment**: Switch experiments in the left list. The right side shows read-only "Objectives" and "Content" sections on top, and your editable "Experiment Record" below.
4. **Write your record**:
   - Click **Show Example** (Lab 1 only) to see a sample.
   - Click **Insert Image** to add a screenshot (provide a label like `fig1`).
   - Click **Insert Reference** to cite a figure in your text (`@fig1`).
   - Each record must contain: a code block, an image, a reference to that image, and enough prose.
5. **Preview**: The right panel shows the compiled PDF layout live.
6. **Export**: Click **Export PDF** in the bottom-right. If validation fails, a modal will tell you what is missing. On success, a PDF named `{ChineseName} - {StudentID}.pdf` is created in the lab folder.

### For Instructors

Prepare a lab folder for each course containing at least:

```
course-folder/
├── lab.json              ← lab configuration (required)
├── images/               ← student images go here
├── utils/
│   └── utils.typ         ← cover page template
└── report-{studentId}.json  ← student data (auto-generated)
```

**`lab.json` structure**: see `example/lab.json` in this repo. Key sections:

- `ui`: interface strings, bilingual.
- `course`: course name, teacher, class, location.
- `student`: validation rules for name and student ID.
- `typst`: Typst source template with `{{...}}` placeholders.
- `experiments[]`: for each experiment,
  - `id`: unique identifier.
  - `name`: experiment name (EN + ZH).
  - `objectives`: learning objectives (read-only display).
  - `content`: required tasks (read-only display).
  - `recordGuide`: what the record should contain (collapsible hint).
  - `placeholder`: placeholder text when the editor is empty.
  - `example`: sample content shown via **Show Example**.
  - `validation`: rules (require code block / figure / figure reference, minimum prose length).

**Important**: text in `objectives` and `content` is inserted directly into Typst source. If it contains Typst-special characters like `[`, `]`, `$`, or `#`, escape them with a backslash (e.g. `\[`) or wrap them in `$...$`.

### Development

```bash
# Install dependencies
npm install

# Download the Typst sidecar for your platform
# Place it in src-tauri/binaries/ — naming conventions are in .github/workflows/release.yml

# Development mode
npm run tauri dev

# Build installers locally
npm run tauri build
```

**Stack**: Tauri 2 + React 18 + TypeScript + Mantine 7 + Zustand.

### Releasing

Pushing a tag triggers GitHub Actions to build installers for Windows, macOS (Intel + ARM), and Linux, and to create a draft release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Then check the draft on the GitHub Releases page and click **Publish** when ready.

### License

MIT