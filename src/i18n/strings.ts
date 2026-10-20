export type Language = 'en' | 'zh';

interface AppStrings {
    openFolder: string;
    dropHint: string;
    studentInfo: string;
    labs: string;
    readOnly: string;
    objectives: string;
    content: string;
    record: string;
    showExample: string;
    copyToEditor: string;
    exampleModalTitle: string;
    exampleWarning: string;
    guideTitle: string;
    insertImage: string;
    insertReference: string;
    insertCode: string;
    preview: string;
    validate: string;
    export: string;
    saving: string;
    saved: string;
    imageLabelPrompt: string;
    imageCaptionPrompt: string;
    confirm: string;
    cancel: string;
    exportSuccess: string;
    exportLocked: string;
    validationFailed: string;
    validationPassed: string;
    missingName: string;
    missingId: string;
    invalidName: string;
    invalidId: string;
    labMissingCode: string;
    labMissingFigure: string;
    labMissingRef: string;
    labTooShort: string;
    refresh: string;
    noPreview: string;
    error: string;
    selectRole: string;
    iAmStudent: string;
    iAmTeacher: string;
    backToRole: string;
    dropZipHint: string;
    openZip: string;
    dirNotEmpty: string;
    extractFailed: string;
    openExistingFolder: string;
    openInFileManager: string;
    addBlock: string;
    blockText: string;
    blockImage: string;
    blockCode: string;
    blockMath: string;
    blockTitle: string;
    blockTitlePlaceholder: string;
    blockCodeLanguage: string;
    blockImageWidth: string;
    blockFormula: string;
    blockFormulaHint: string;
    blockTextHint: string;
    deleteBlock: string;
    dateLabel: string;
    dateDefault: string;
    titleEmpty: string;
    titleDuplicate: string;
    unreferencedWarning: string;
    danglingRefWarning: string;
    labMinCodeBlocks: string;
    labMinFigures: string;
    labMinTextBlocks: string;
    optional: string;
    ambiguousRefWarning: string;
    textRawMode: string;
    textRawModeHint: string;
    textRawPlaceholder: string;
    formulaFormat: string;
    blockFormulaHintLatex: string;
    blockHeading: string;
    headingLevel: string;
    headingLevel1: string;
    headingLevel2: string;
    headingLevel3: string;
    headingLevel4: string;
    headingLevel5: string;
    headingLevel6: string;
    headingContent: string;
}

export const strings: Record<Language, AppStrings> = {
    en: {
        openFolder: 'Open Folder',
        dropHint: 'Drop a lab folder here, or click "Open Folder"',
        studentInfo: 'Student Information',
        labs: 'Labs',
        readOnly: 'Read-only',
        objectives: 'Objectives & Requirements',
        content: 'Experiment Content',
        record: 'Experiment Record',
        showExample: 'Show Example',
        copyToEditor: 'Copy to editor',
        exampleModalTitle: 'Example Record',
        exampleWarning: 'This is a sample. Do NOT submit it as your own work.',
        guideTitle: 'What to include in your record',
        insertImage: 'Insert Image',
        insertReference: 'Insert Reference',
        insertCode: 'Insert Code',
        preview: 'Preview',
        validate: 'Validate',
        export: 'Export PDF',
        saving: 'Saving…',
        saved: 'Saved',
        imageLabelPrompt: 'Label (used for @reference)',
        imageCaptionPrompt: 'Caption',
        confirm: 'Confirm',
        cancel: 'Cancel',
        exportSuccess: 'PDF exported: {file}',
        exportLocked: 'The PDF file is currently open. Please close it and try again.',
        validationFailed: 'Validation failed',
        validationPassed: 'All checks passed. Ready to export.',
        missingName: 'Please enter your Chinese name.',
        missingId: 'Please enter your student ID.',
        invalidName: 'Name must contain at least one Chinese character.',
        invalidId: 'Student ID must be 4–20 letters or digits.',
        labMissingCode: 'Lab "{lab}": missing a code block.',
        labMissingFigure: 'Lab "{lab}": missing an image.',
        labMissingRef: 'Lab "{lab}": image must be labeled and referenced.',
        labTooShort: 'Lab "{lab}": text explanation too short (need ≥ {n} characters).',
        refresh: 'Refresh',
        noPreview: 'No preview yet.',
        error: 'Error',
        selectRole: 'Choose your role',
        iAmStudent: 'I am a Student',
        iAmTeacher: 'I am a Teacher',
        backToRole: 'Change role',
        dropZipHint: 'Drop your lab ZIP file here, or click "Open ZIP"',
        openZip: 'Open ZIP',
        dirNotEmpty: 'The selected folder is not empty. Please choose an empty folder.',
        extractFailed: 'Failed to open the ZIP file.',
        openExistingFolder: 'Open Existing Folder',
        openInFileManager: 'Open Project Folder',
        addBlock: 'Add block',
        blockText: 'Text',
        blockImage: 'Image',
        blockCode: 'Code',
        blockMath: 'Formula',
        blockTitle: 'Title',
        blockTitlePlaceholder: 'Give this block a unique title',
        blockCodeLanguage: 'Language',
        blockImageWidth: 'Width',
        blockFormula: 'Formula',
        blockFormulaHint: 'Use https://typerino.com/ to compose the formula, then paste it here (with or without surrounding $).',
        blockTextHint: 'Type text here. Use [[Title]] to reference an image, code block, or formula. Typst syntax is supported: = heading, == subheading, *bold*, $x^2$, etc.',
        deleteBlock: 'Delete',
        dateLabel: 'Report date',
        dateDefault: 'Default (today)',
        titleEmpty: 'Title is required',
        titleDuplicate: 'Title must be unique within this experiment',
        unreferencedWarning: 'This block is not referenced in any text',
        danglingRefWarning: 'References a title that does not exist',
        labMinCodeBlocks: 'Lab "{lab}": need at least {n} code block(s).',
        labMinFigures: 'Lab "{lab}": need at least {n} figure(s).',
        labMinTextBlocks: 'Lab "{lab}": need at least {n} text block(s).',
        optional: 'optional',
        ambiguousRefWarning: 'Multiple blocks share this title; use the Insert Reference button to disambiguate.',
        textRawMode: 'Raw Typst source (no escaping)',
        textRawModeHint: 'Turn on to write raw Typst. The text is inserted as-is: no escaping, no [[Title]] references.',
        textRawPlaceholder: 'Write raw Typst source here...',
        formulaFormat: 'Format',
        blockFormulaHintLatex: 'LaTeX formula, converted via mitex. Example: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
        blockHeading: 'Heading',
        headingLevel: 'Heading level',
        headingLevel1: "Heading 1",
        headingLevel2: "Heading 2",
        headingLevel3: "Heading 3",
        headingLevel4: "Heading 4",
        headingLevel5: "Heading 5",
        headingLevel6: "Heading 6",
        headingContent: 'Heading text',
    },
    zh: {
        openFolder: '打开目录',
        dropHint: '将实验目录拖到这里，或点击“打开目录”',
        studentInfo: '学生信息',
        labs: '实验列表',
        readOnly: '只读',
        objectives: '实验目的和要求',
        content: '实验内容',
        record: '实验记录',
        showExample: '查看示例',
        copyToEditor: '复制到编辑框',
        exampleModalTitle: '示例实验记录',
        exampleWarning: '这是示例，请勿直接提交。',
        guideTitle: '实验记录应包含的内容',
        insertImage: '插入图片',
        insertReference: '插入图片引用',
        insertCode: '插入代码',
        preview: '预览',
        validate: '检查',
        export: '导出 PDF',
        saving: '保存中…',
        saved: '已保存',
        imageLabelPrompt: '图片标签（用于 @ 引用）',
        imageCaptionPrompt: '图片标题',
        confirm: '确定',
        cancel: '取消',
        exportSuccess: 'PDF 已导出：{file}',
        exportLocked: 'PDF 文件正被打开，请先关闭后再试。',
        validationFailed: '检查未通过',
        validationPassed: '全部检查通过，可以导出。',
        missingName: '请填写中文姓名。',
        missingId: '请填写学号。',
        invalidName: '姓名必须至少包含一个中文字符。',
        invalidId: '学号必须为 4–20 位字母或数字。',
        labMissingCode: '实验“{lab}”：缺少代码块。',
        labMissingFigure: '实验“{lab}”：缺少图片。',
        labMissingRef: '实验“{lab}”：图片需要标签并在正文中引用。',
        labTooShort: '实验“{lab}”：文字说明过短（至少 {n} 字符）。',
        refresh: '刷新',
        noPreview: '暂无预览。',
        error: '错误',
        selectRole: '请选择你的身份',
        iAmStudent: '我是学生',
        iAmTeacher: '我是老师',
        backToRole: '切换身份',
        dropZipHint: '将实验 ZIP 包拖到这里，或点击“打开 ZIP”',
        openZip: '打开 ZIP',
        dirNotEmpty: '所选文件夹不为空，请选择一个空文件夹。',
        extractFailed: '打开 ZIP 文件失败。',
        openExistingFolder: '打开已有目录',
        openInFileManager: '打开项目目录',
        addBlock: '添加内容',
        blockText: '文本',
        blockImage: '图片',
        blockCode: '代码',
        blockMath: '公式',
        blockTitle: '标题',
        blockTitlePlaceholder: '给这个内容起一个唯一的标题',
        blockCodeLanguage: '语言',
        blockImageWidth: '宽度',
        blockFormula: '公式',
        blockFormulaHint: '使用 https://typerino.com/ 编辑公式，然后粘贴到这里（带不带 $ 都可以）。',
        blockTextHint: '在此输入文本。使用 [[标题]] 引用图片、代码或公式。支持 Typst 语法：= 标题、== 子标题、*粗体*、$x^2$ 等。',
        deleteBlock: '删除',
        dateLabel: '报告日期',
        dateDefault: '默认（今天）',
        titleEmpty: '标题不能为空',
        titleDuplicate: '标题在本实验内不能重复',
        unreferencedWarning: '此内容未在文本中被引用',
        danglingRefWarning: '引用了不存在的标题',
        labMinCodeBlocks: '实验"{lab}"：至少需要 {n} 段代码。',
        labMinFigures: '实验"{lab}"：至少需要 {n} 张图片。',
        labMinTextBlocks: '实验"{lab}"：至少需要 {n} 个文本块。',
        optional: '可选',
        ambiguousRefWarning: '有多个同名 block，建议用"插入引用"按钮精确定位。',
        textRawMode: 'Typst 源代码（不做转义）',
        textRawModeHint: '打开后文本原样写入，不做转义，也不会处理 [[标题]] 引用。',
        textRawPlaceholder: '在此输入 Typst 源代码……',
        formulaFormat: '格式',
        blockFormulaHintLatex: 'LaTeX 公式，通过 mitex 转换。例如：\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
        blockHeading: '标题',
        headingLevel: '标题级别',
        headingLevel1: "一级标题",
        headingLevel2: "二级标题",
        headingLevel3: "三级标题",
        headingLevel4: "四级标题",
        headingLevel5: "五级标题",
        headingLevel6: "六级标题",
        headingContent: '标题内容',
    },
};

/** 双语并列显示，用于 lab.json 尚未加载时 */
export function bilingual(key: keyof AppStrings): string {
    return `${strings.zh[key]} / ${strings.en[key]}`;
}