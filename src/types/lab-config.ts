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
    requireCodeBlock: boolean;
    requireFigure: boolean;
    requireFigureReference: boolean;
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
    example: string;
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
    codeLanguages: string[];
}

export interface LabelInfo {
    label: string;
    kind: 'figure' | 'code';
    title: string;
}

export interface StudentData {
    name: string;
    studentId: string;
    className: string;
    location: string;
    records: Record<string, string>;
    labels: Record<string, LabelInfo[]>;
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
    kind: 'code_block' | 'figure' | 'figure_reference' | 'prose';
    extra?: number;
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