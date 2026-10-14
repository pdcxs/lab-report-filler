# Lab Report Filler

A desktop app for filling in Typst-based lab reports without touching Typst source code. Instructors design the template; students only fill in their name, student ID, class, location, and experiment records. Export produces a clean PDF named `{ChineseName} - {StudentID}.pdf`.

[English](README.md) | [中文](README.zh.md)

---

## Overview

Lab Report Filler solves a common problem in programming courses: students are unfamiliar with LaTeX/Typst markup, and their Word/LaTeX formatting is inconsistent. This app lets instructors define the lab structure (objectives, content, requirements, validation rules) in a single `lab.json` file, then distribute it as a ZIP package. Students open the ZIP, fill in text boxes, and click **Export PDF**.

The app is built with **Tauri 2 + React + TypeScript + Mantine**, and bundles the Typst compiler so students do not need to install anything beyond the app itself.

## Features

- 🎯 **Zero Typst knowledge required** — students only see text fields and buttons.
- 🌐 **Bilingual UI** — driven by `language` in `lab.json` (`"zh"` or `"en"`).
- 🌓 **Light / dark theme** — follows the system or manual toggle.
- 🖼️ **Friendly image insertion** — pick a file, set a label and caption, and the app copies it into `images/` and inserts a labeled `#figure(...)` block.
- 💻 **Code block insertion** — pick a language, paste code, add a caption and label.
- 🔗 **Reference helper** — lists all labeled figures and code blocks in the current record and inserts `@label` on click.
- 📄 **Live preview** — recompiles 800 ms after the last edit and renders SVG pages on the right.
- ✅ **Pre-export validation** — missing code blocks, figures, references, or short prose will block the export with a clear modal.
- 💾 **Auto-save** — writes to a JSON file 800 ms after the last edit.
- 🗂️ **Folder memory** — reopens the last lab folder on next launch.
- 👩‍🏫 **Teacher mode** — build and preview a lab template, then export it as a ZIP for students.

## System Requirements

- **Windows**: Windows 10 or later.
- **macOS**: macOS 11 or later (Apple Silicon and Intel builds available).
- **Linux**: mainstream distributions (AppImage and deb).

## Installation

Download the installer for your platform from the [Releases](https://github.com/pdcxs/lab-report-filler/releases) page:

| Platform                         | Recommended installer |
| -------------------------------- | --------------------- |
| Windows                          | `.msi` or `.exe`      |
| macOS (Apple Silicon / M-series) | `aarch64.dmg`         |
| macOS (Intel)                    | `x64.dmg`             |
| Linux                            | `.AppImage` or `.deb` |

**macOS users**: The app is not code-signed. On first launch, macOS may warn that it is from an unidentified developer. Right-click the app → **Open**, or allow it in **System Settings → Privacy & Security**.

---

## For Students

### Step 1 — Get the lab package

Your instructor will give you a **ZIP file** (for example `Java-Programming-Lab.zip`). Download it to your computer. **Do not** unzip it manually — the app will do it for you.

### Step 2 — Choose Student mode

Launch the app. On the welcome screen, click **I am a Student**.

### Step 3 — Open the ZIP

You have two ways:

- Click **Open ZIP**, then select the ZIP file you received.
- Or **drag and drop** the ZIP file directly onto the app window.

The app will show a modal asking you to **choose an empty folder**. The lab package will be extracted there.

**Important**: Pick an *empty* folder (for example, create a new folder on your Desktop called `JavaLab`). If the folder already contains files, the app will ask you to choose another one.

### Step 4 — Fill in your information

On the left panel, fill in:

- **Chinese Name** — must contain at least one Chinese character.
- **Student ID** — 4–20 letters or digits.
- **Class** — leave blank to use the default from your instructor.
- **Location** — leave blank to use the default from your instructor.

### Step 5 — Work on each experiment

Switch between experiments using the list on the left.

The right side shows three sections:

1. **Objectives & Requirements** — read-only.
2. **Experiment Content** — read-only. This is the task.
3. **What to include in your record** — read-only hints.

Below these is the **Experiment Record** editor, where you write your answer.

### Step 6 — Write your record

Use the toolbar buttons above the editor:

- **Insert Code** — pick a language, paste your code, give it a caption and a label. The app inserts a `#figure` block with your code.
- **Insert Image** — pick a screenshot, set a label and caption. The app copies the image into the project and inserts a labeled figure.
- **Insert Reference** — lists all labeled figures and code blocks in the current record. Click one to insert `@label` into your text. Use this to refer to your figures in prose.
- **Show Example** — only for Experiment 1. Shows a fully worked example. You can copy it and adapt it.

Each record must contain (per the validation rules):

- At least one code block.
- At least one figure.
- A reference to that figure in the text (using `@label`).
- At least 50 characters of prose (excluding code, figures, and Typst commands).

### Step 7 — Preview

The panel on the right recompiles 800 ms after you stop typing and shows the live PDF layout.

### Step 8 — Validate and Export

Click **Validate** in the bottom-right to check everything. If something is missing, a modal will tell you exactly what.

When validation passes, click **Export PDF**. The PDF will be created in the project folder with the name:

```
{ChineseName} - {StudentID}.pdf
```

You can also click **Open Project Folder** in the top bar to open the folder in your file manager.

### Step 9 — Submit

Upload the PDF file to your course's submission system.

### Tips

- **Autosave**: Your work is saved automatically 800 ms after you stop typing. The badge at the top shows **Saving…** or **Saved**.
- **Switching projects**: To work on another lab, click **Open ZIP** in the top bar.
- **Reopening**: The app remembers your last folder and opens it automatically next time.
- **Missing toolbar**: If you don't see the toolbar buttons, make sure you are in the **Experiment Record** editor (below the read-only panels).

---

## For Instructors

### Step 1 — Choose Teacher mode

Launch the app, click **I am a Teacher** on the welcome screen.

### Step 2 — Fill in course info

Enter:

- **Course Name** — e.g. `Java语言程序设计`.
- **Teacher** — e.g. `陈笑沙`.
- **Default Class** — e.g. `计算机LY2501`. Students can override this.
- **Default Location** — e.g. `E206`. Students can override this.
- **Language** — `zh` or `en`. Controls the UI language students see.
- **Code Languages** — one language per line. Students will see these in the **Insert Code** dropdown.

### Step 3 — Configure student fields

Set the labels and placeholders students will see for their name, student ID, class, and location. You can also set:

- Minimum / maximum name length.
- Whether the name must contain at least one Chinese character.
- A regex pattern for validating the student ID format.

### Step 4 — Add experiments

Click **+ Add Experiment** to add experiments. For each experiment:

- **Name** — e.g. `Java语言初探`.
- **Objectives & Requirements** — Typst source. Write `+ 内容` to create a numbered list item, or write plain paragraphs.
- **Experiment Content** — Typst source. Same rules.
- **Instrument** — e.g. `电脑`.
- **Record Guide** — one line per item. These appear to students as bullet-point hints.
- **Editor Placeholder** — text shown in the empty editor box.
- **Example** — content shown when the student clicks **Show Example**. Can be empty.
- **Validation rules** — what each student record must contain (code block, figure, figure reference, minimum prose length).

You can drag experiments in the left panel to reorder them.

### Step 5 — Preview

Click **Open Preview** in the top bar to see the full report as it would be rendered. The preview updates 800 ms after the last edit.

The preview uses the default logo. To see a different logo, click **Select Logo** and pick an image file.

### Step 6 — Export the package

Click **Export ZIP** in the top bar. Choose where to save the ZIP file. The app will:

1. Create a temporary folder with:
   - `lab.json`
   - `utils/utils.typ`
   - `imgs/tyut-logo.jpg` (or the logo you selected)
2. Compress it into a ZIP at the location you chose.
3. Clean up the temporary folder.

Distribute the ZIP to your students (via LMS, email, USB, etc.).

### Persistent draft

Your edits are saved automatically to a draft file in the app data folder (`teacher-draft.json`). If you close the app and reopen it, your work-in-progress will be restored.

To start over, click **New** in the top bar. This clears the current draft and starts with an empty template.

### Customizing the cover

The default `utils/utils.typ` includes a cover page with the Taiyuan University of Technology logo. If you want to use a different institution's logo:

1. Click **Select Logo** and choose the image.
2. It will be included in the ZIP as `imgs/tyut-logo.jpg`, regardless of the original filename.

To customize the cover layout itself, edit `utils/utils.typ` in the exported folder and re-zip manually. The app does not currently support editing `utils.typ` from the UI.

### Editing `lab.json` directly

If you need to edit `lab.json` (for example, to add custom Typst commands in the preamble), unzip the exported package, edit the file, and re-zip it. The app reads the standard `lab.json` schema.

---

## Project Structure

An extracted lab package looks like this:

```
lab-folder/
├── lab.json                    # Course config + experiments
├── images/                     # Student images (created automatically)
├── utils/
│   └── utils.typ               # Cover page template
├── imgs/
│   └── tyut-logo.jpg           # Cover logo
├── report-draft.json           # Student data (before ID is set)
└── report-{studentId}.json     # Student data (after ID is set)
```

After exporting, you will also find:

```
{ChineseName} - {StudentID}.pdf
```

---

## Development

```bash
# Install dependencies
npm install

# Download the Typst sidecar for your platform
# See .github/workflows/release.yml for naming conventions
# Place the binary in src-tauri/binaries/

# Run in development mode
npm run tauri dev

# Build installers locally
npm run tauri build
```

**Stack**: Tauri 2, React 18, TypeScript, Mantine 7, Zustand.

## Releasing

Push a tag to trigger GitHub Actions. The workflow builds installers for Windows, macOS (Intel + ARM), and Linux, and creates a draft release.

```bash
git tag v0.2.0
git push origin v0.2.0
```

Then check the draft on the GitHub Releases page and click **Publish** when ready.

## License

MIT — see [LICENSE](LICENSE).

