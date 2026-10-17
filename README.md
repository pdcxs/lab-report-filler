# Lab Report Filler

A desktop app for filling in lab reports without touching source code. Instructors design the template and distribute it as a ZIP; students fill in text, insert images/code/formulas as cards, and export a PDF with one click.

[English](README.md) | [中文](README.zh.md)

---

## System Requirements

- **Windows**: Windows 10 or later. No extra setup needed.
- **macOS**: macOS 11 or later (Apple Silicon and Intel builds available). No extra setup needed.
- **Linux**: mainstream distributions. **Typst must be installed separately** — see below.

### Installing Typst on Linux

The app uses the [Typst](https://typst.app/) compiler to generate PDFs. Windows and macOS builds bundle Typst; **Linux builds do not**. Install it first:

| Distribution         | Command                     |
| -------------------- | --------------------------- |
| Arch Linux           | `sudo pacman -S typst`      |
| Ubuntu / Debian      | `sudo apt install typst`    |
| Fedora               | `sudo dnf install typst`    |
| openSUSE             | `sudo zypper install typst` |
| Any system with Rust | `cargo install typst-cli`   |

If your distribution's repository does not provide a `typst` package, use `cargo install typst-cli` (requires Rust). After installation, verify with:

```bash
typst --version
```

The app checks for Typst on startup and shows installation instructions if it is missing.

---

## Installation

Download the installer for your platform from the [Releases](https://github.com/pdcxs/lab-report-filler/releases) page:

| Platform                         | Installer                                          |
| -------------------------------- | -------------------------------------------------- |
| Windows                          | `.msi` or `.exe`                                   |
| macOS (Apple Silicon / M-series) | `aarch64.dmg`                                      |
| macOS (Intel)                    | `x64.dmg`                                          |
| Linux                            | `.deb` or `.AppImage` (requires Typst — see above) |

**macOS users**: The app is not code-signed. On first launch, macOS may warn that it is from an unidentified developer. Right-click the app → **Open**, or allow it in **System Settings → Privacy & Security**.

---

## For Students

### 1. Get the lab package

Your instructor will give you a **ZIP file** (for example `Java-Programming-Lab.zip`). Do not unzip it manually — the app will do that for you.

### 2. Choose Student mode

Launch the app. On the welcome screen, click **I am a Student**.

### 3. Open the ZIP

You can either:

- Click **Open ZIP** and select the ZIP file.
- Or drag the ZIP file onto the app window.

A dialog will ask you to **choose an empty folder**. The package will be extracted there.

> Pick an empty folder, for example a new folder on your Desktop named `JavaLab`. If the folder already has files, you will be asked to pick another one.

### 4. Fill in your information

On the left panel:

- **Name** — must contain at least one Chinese character.
- **Student ID** — 4–20 letters or digits.
- **Class** — leave blank to use the default.
- **Location** — leave blank to use the default.

Your work saves automatically 800 ms after you stop typing. The badge at the top shows **Saving…** or **Saved**.

### 5. Work on each experiment

Switch experiments using the list on the left. Each experiment page has:

- **Objectives & Requirements** — read-only.
- **Experiment Content** — read-only. This is the task.
- **Report date** — optional. Leave empty to use today's date on the cover.
- **Experiment Record** — the editor, where you build your report from cards.

### 6. Build your record with cards

Click **Add block** to insert one of four card types. Each card can be dragged to reorder and deleted individually.

**Text card** — type your explanation. Typst syntax is supported:

- `= Heading` for level-1, `== Heading` for level-2, and so on.
- `*bold*`, `_italic_`.
- `` `inline code` `` for inline code.
- `$x^2 + y^2 = r^2$` for inline math.
- `#`, `[`, `]`, `@`, and `//` are escaped automatically, so you can type them safely.

**Image card** — pick a screenshot, give it a **title** (required), and adjust the display width. The title is used as the figure caption.

**Code card** — choose a language, paste your code, and give it a **title** (required). The title is used as the listing caption.

**Formula card** — use <https://typerino.com/> to compose the formula, paste it here. Every formula card is **automatically numbered** (`(1)`, `(2)`, …). Give it a **title** (optional) if you want to reference it from a text card; if left blank, the formula is still numbered but cannot be referenced.

### 7. Reference other cards

Every image, code, and formula card with a title can be referenced from a text card using the syntax `[[Title]]`:

- `[[Title]]` references the **first** card with that title in this experiment.
- `[[Title-uid]]` references a **specific** card. The `uid` is the short 16-character code shown on the card (for example `abc123xyz456def0`).
- **If you have multiple cards with the same title**, `[[Title]]` will be flagged as ambiguous. Use the **Insert Reference** button in a text card — it automatically inserts `[[Title-uid]]`, which always points to the correct card.

The easiest way to reference a card is to click **Insert Reference** in a text card and pick the title from the menu. The app inserts the precise `[[Title-uid]]` form at the cursor. In the generated PDF, both forms render as a clickable "Figure 1", "Listing 1", or "(1)".

**You should reference every image, code, and formula you insert.** Unreferenced cards are highlighted in yellow, and export will be blocked if your instructor enabled that check.

### 8. Preview

The right panel shows a live preview of the generated PDF, refreshed 800 ms after your last edit.

### 9. Validate and export

Click **Validate** to check for missing name, ID, or required blocks. If something is missing, a dialog tells you exactly what.

Click **Export PDF** to generate `{Your Name} - {Your ID}.pdf` in the lab folder. You can click **Open Project Folder** in the top bar to open the folder in your file manager.

### 10. Submit

Upload the PDF to your course's submission system.

### Tips

- **Switch projects**: click **Open ZIP** in the top bar to open another lab.
- **Reopen last project**: the app opens your last lab folder automatically next time.
- **Close the PDF before re-exporting**: if the PDF is open in a reader, the app will tell you to close it first.

---

## For Instructors

### 1. Choose Teacher mode

Launch the app, click **I am a Teacher**.

### 2. Fill in course information

- **Course Name** — the course title, shown on the cover page.
- **Teacher** — the instructor's name, shown on the cover page.
- **Default Class** — the class name shown on the cover. Students can override it.
- **Default Location** — the lab room shown on the cover. Students can override it.
- **Language** — `中文` or `English`. Controls the interface language students see.
- **Code Languages** — one language per line. Students see these in the **Code card** dropdown.

### 3. Configure student fields

The labels and placeholders for name, student ID, class, and location are set automatically from the language. You can still configure:

- Minimum / maximum name length.
- Whether the name must contain at least one Chinese character.
- A regex pattern to validate the student ID format.

### 4. Add experiments

Click **+ Add Experiment** to add experiments. For each experiment:

- **Name** — the experiment title, shown on the cover and at the top of the experiment page.
- **Objectives & Requirements** — Typst source. Write `+ Item` to create a numbered list item, or write plain paragraphs.
- **Content** — Typst source. Same rules.
- **Instrument** — equipment used, e.g. "Computer".
- **Record Guide** — one line per item. Students see these as bullet-point hints.
- **Editor placeholder** — hint text shown in the empty editor.
- **Validation rules**:
  - Minimum number of code cards, image cards, and text cards.
  - Minimum number of prose characters (sum across all text cards).
  - Whether every image/code/formula card must be referenced from a text card via `[[Title]]` or `[[Title-uid]]`.

Drag experiments in the left panel to reorder them.

### 5. Preview

Click **Open Preview** in the top bar to see the rendered report. The preview updates 800 ms after the last edit.

The preview uses the default logo (Taiyuan University of Technology). To use another logo, click **Select Logo** and pick an image file.

### 6. Export the package

Click **Export ZIP** and choose where to save the ZIP. The app will:

1. Create a temporary folder containing `lab.json`, `utils/utils.typ`, and `imgs/tyut-logo.jpg`.
2. Compress it into the ZIP you specified.
3. Clean up the temporary folder.

Distribute the ZIP to your students (LMS, email, USB, etc.).

### 7. Persistent draft

Your edits are saved automatically to a draft in the app data folder. Close and reopen the app and your work-in-progress will be restored. Click **New** to start over with an empty template.

### 8. Customizing the cover

To use a different institution's logo, click **Select Logo** and pick an image. It will be packaged as `imgs/tyut-logo.jpg` regardless of the original file name.

To change the cover layout itself, edit `utils/utils.typ` in the exported folder and re-zip manually. The app does not support editing `utils.typ` from the UI.

---

## License

MIT — see [LICENSE](LICENSE).