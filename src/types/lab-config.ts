export interface LocalizedString {
    en: string;
    zh: string;
}

export interface LocalizedStringList {
    en: string[];
    zh: string[];
}

export interface UiConfig {
    defaultLanguage: string;
    availableLanguages: string[];
    appTitle: LocalizedString;
    strings: Record<string, LocalizedString>;
}

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
    courseName: LocalizedString;
    teacherName: LocalizedString;
    className: LocalizedString;
    location: LocalizedString;
}

export interface StudentNameConfig {
    label: LocalizedString;
    placeholder: LocalizedString;
    hint: LocalizedString;
    minLength: number;
    maxLength: number;
    requireCJK: boolean;
}

export interface StudentIdConfig {
    label: LocalizedString;
    placeholder: LocalizedString;
    pattern: string;
}

export interface StudentConfig {
    name: StudentNameConfig;
    studentId: StudentIdConfig;
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
    name: LocalizedString;
    objectives: LocalizedStringList;
    content: LocalizedStringList;
    recordGuide: LocalizedStringList;
    placeholder: LocalizedString;
    example: string;
    validation: ValidationRules;
}

export interface LabConfig {
    version: string;
    ui: UiConfig;
    storage: StorageConfig;
    export: ExportConfig;
    course: CourseConfig;
    student: StudentConfig;
    typst: TypstConfig;
    experiments: Experiment[];
}

export interface StudentData {
    name: string;
    studentId: string;
    records: Record<string, string>;
}

export interface LabSession {
    dir: string;
    config: LabConfig;
}

export interface AppSettings {
    lastLabDir: string | null;
    lastLanguage: string | null;
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