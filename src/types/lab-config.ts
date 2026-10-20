export interface StorageConfig {
    dataFileNamePattern: string;
    draftFileName: string;
    generatedTypstNamePattern: string;
    imagesFolder: string;
}

export interface ExportConfig {
    fileNamePattern: string;
    overwriteSilently: boolean;
    requireFileClosed: boolean;
}

export interface CourseConfig {
    courseName: string;
    teacherName: string;
    className: string;
    location: string;
}

export interface SimpleFieldConfig {
    label: string;
    placeholder: string;
}

export interface StudentNameConfig {
    label: string;
    placeholder: string;
    hint: string;
    minLength: number;
    maxLength: number;
    requireCjk: boolean;
}

export interface StudentIdConfig {
    label: string;
    placeholder: string;
    pattern: string;
}

export interface StudentConfig {
    name: StudentNameConfig;
    studentId: StudentIdConfig;
    className: SimpleFieldConfig;
    location: SimpleFieldConfig;
}

export interface TypstConfig {
    preamble: string[];
    experimentSection: string[];
}

export interface ValidationRules {
    requireAllReferenced: boolean;
    minCodeBlocks: number;
    minFigures: number;
    minTextBlocks: number;
    minProseChars: number;
}

export interface Experiment {
    id: string;
    name: string;
    objectives: string;
    content: string;
    instrument: string;
    recordGuide: string[];
    placeholder: string;
    validation: ValidationRules;
}

export interface LabConfig {
    version: string;
    language: 'zh' | 'en';
    storage: StorageConfig;
    export: ExportConfig;
    course: CourseConfig;
    student: StudentConfig;
    typst: TypstConfig;
    experiments: Experiment[];
    codeLanguages: CodeLanguage[];
}

// =====================================================================
// Block
// =====================================================================

export interface CodeLanguage {
    name: string;
    /** 老师手动设置的后缀名列表（小写，不含点）。未设置时使用默认表。 */
    extensions?: string[];
}

export type Block =
    | { type: 'text'; uid: string; content: string; raw: boolean; collapsed?: boolean }
    | {
        type: 'image';
        uid: string;
        title: string;
        relativePath: string;
        width: number;
        collapsed?: boolean;
    }
    | {
        type: 'code';
        uid: string;
        title: string;
        language: string;
        code: string;
        collapsed?: boolean;
    }
    | {
        type: 'math';
        uid: string;
        title: string;
        formula: string;
        format: 'typst' | 'latex';
        collapsed?: boolean;
    }
    | {
        type: 'heading';
        uid: string;
        level: number;
        content: string;
        collapsed?: boolean;
    };



export interface StudentData {
    name: string;
    studentId: string;
    className: string;
    location: string;
    records: Record<string, Block[]>;
    dates: Record<string, string | null>;
}

export interface LabSession {
    dir: string;
    config: LabConfig;
}

export interface AppSettings {
    lastLabDir: string | null;
    lastRole: 'student' | 'teacher' | null;
}

export interface ImportedImage {
    relativePath: string;
    fileName: string;
}

export interface GeneratedTypst {
    typstPath: string;
    source: string;
}

export interface PreviewResult {
    pages: string[];
}

export interface ValidationIssue {
    labId: string;
    kind:
    | 'min_code_blocks'
    | 'min_figures'
    | 'min_text_blocks'
    | 'prose'
    | 'unreferenced'
    | 'dangling_ref'
    | 'ambiguous_ref';
    extra?: number;
    label?: string;
}

export interface ValidationReport {
    passed: boolean;
    globalErrors: string[];
    issues: ValidationIssue[];
}

export interface ExportResult {
    pdfPath: string;
    fileName: string;
}