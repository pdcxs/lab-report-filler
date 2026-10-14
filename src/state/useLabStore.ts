import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    AppSettings,
    ImportedImage,
    LabConfig,
    LabSession,
    PreviewResult,
    StudentData,
    ValidationReport,
    ExportResult,
} from '../types/lab-config';

interface LabState {
    // ---- 全局 ----
    dir: string | null;
    config: LabConfig | null;
    lang: 'en' | 'zh';
    student: StudentData;
    activeLabId: string | null;

    // ---- 运行态 ----
    saving: boolean;
    lastSaved: string | null;   // 显示 "Saved" 用
    previewPages: string[];
    previewError: string | null;
    exporting: boolean;
    validating: boolean;

    // ---- actions ----
    init: () => Promise<void>;
    openDir: (path: string) => Promise<void>;
    setLang: (l: 'en' | 'zh') => void;
    setActiveLab: (id: string) => void;
    updateStudent: (patch: Partial<StudentData>) => void;
    updateRecord: (labId: string, content: string) => void;
    saveNow: () => Promise<void>;
    importImage: (src: string) => Promise<ImportedImage>;
    refreshPreview: () => Promise<void>;
    validate: () => Promise<ValidationReport | null>;
    exportPdf: () => Promise<ExportResult | null>;
    reset: () => void;
}

const emptyStudent: StudentData = { name: '', studentId: '', records: {} };

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

export const useLabStore = create<LabState>((set, get) => {
    const scheduleSave = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            void get().saveNow();
        }, 800);
    };

    const schedulePreview = () => {
        if (previewTimer) clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            void get().refreshPreview();
        }, 800);
    };

    return {
        dir: null,
        config: null,
        lang: 'en',
        student: emptyStudent,
        activeLabId: null,

        saving: false,
        lastSaved: null,
        previewPages: [],
        previewError: null,
        exporting: false,
        validating: false,

        // ---- 启动：读 settings，若上次的目录还在，直接打开 ----
        init: async () => {
            try {
                const settings = await invoke<AppSettings>('load_settings');
                if (settings.lastLanguage === 'zh' || settings.lastLanguage === 'en') {
                    set({ lang: settings.lastLanguage });
                }
                if (settings.lastLabDir) {
                    try {
                        await get().openDir(settings.lastLabDir);
                    } catch {
                        // 目录已经不在了，忽略，让用户手动重新选
                    }
                }
            } catch (e) {
                console.warn('init failed', e);
            }
        },

        openDir: async (path: string) => {
            const session = await invoke<LabSession>('open_lab_dir', { path });
            const data = await invoke<StudentData>('load_student_data', {
                dir: session.dir,
                config: session.config,
                studentId: null,
            });
            const lang =
                get().lang ||
                (session.config.ui.defaultLanguage as 'en' | 'zh') ||
                'en';

            set({
                dir: session.dir,
                config: session.config,
                student: data,
                activeLabId: session.config.experiments[0]?.id ?? null,
                lang,
                previewPages: [],
                previewError: null,
            });

            // 记忆目录
            try {
                await invoke('save_settings', {
                    settings: { lastLabDir: session.dir, lastLanguage: lang },
                });
            } catch (e) {
                console.warn('save settings failed', e);
            }

            void get().refreshPreview();
        },

        setLang: (l) => {
            set({ lang: l });
            const dir = get().dir;
            if (dir) {
                void invoke('save_settings', {
                    settings: { lastLabDir: dir, lastLanguage: l },
                });
            }
            void get().refreshPreview();
        },

        setActiveLab: (id) => set({ activeLabId: id }),

        updateStudent: (patch) => {
            set((s) => ({ student: { ...s.student, ...patch } }));
            scheduleSave();
            schedulePreview();
        },

        updateRecord: (labId, content) => {
            set((s) => ({
                student: {
                    ...s.student,
                    records: { ...s.student.records, [labId]: content },
                },
            }));
            scheduleSave();
            schedulePreview();
        },

        saveNow: async () => {
            const { dir, config, student } = get();
            if (!dir || !config) return;
            set({ saving: true });
            try {
                const fileName = await invoke<string>('save_student_data', {
                    dir,
                    config,
                    data: student,
                });
                set({ saving: false, lastSaved: fileName });
            } catch (e) {
                console.error('save failed', e);
                set({ saving: false });
            }
        },

        importImage: async (src) => {
            const { dir } = get();
            if (!dir) throw new Error('No directory open');
            return invoke<ImportedImage>('import_image', { dir, srcPath: src });
        },

        refreshPreview: async () => {
            const { dir, config, student, lang } = get();
            if (!dir || !config) return;
            try {
                const result = await invoke<PreviewResult>('compile_preview', {
                    dir,
                    config,
                    data: student,
                    lang,
                });
                set({ previewPages: result.pages, previewError: null });
            } catch (e) {
                set({ previewError: String(e) });
            }
        },

        validate: async () => {
            const { config, student, lang } = get();
            if (!config) return null;
            set({ validating: true });
            try {
                const report = await invoke<ValidationReport>('validate_report', {
                    config,
                    data: student,
                    lang,
                });
                set({ validating: false });
                return report;
            } catch (e) {
                set({ validating: false });
                throw e;
            }
        },

        exportPdf: async () => {
            const { dir, config, student, lang } = get();
            if (!dir || !config) return null;
            set({ exporting: true });
            try {
                const result = await invoke<ExportResult>('export_pdf', {
                    dir,
                    config,
                    data: student,
                    lang,
                });
                set({ exporting: false });
                return result;
            } catch (e) {
                set({ exporting: false });
                throw e;
            }
        },

        reset: () => {
            set({
                dir: null,
                config: null,
                student: emptyStudent,
                activeLabId: null,
                previewPages: [],
                previewError: null,
                lastSaved: null,
            });
        },
    };
});