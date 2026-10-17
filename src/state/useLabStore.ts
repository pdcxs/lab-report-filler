import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    AppSettings,
    Block,
    ExportResult,
    ImportedImage,
    LabConfig,
    LabSession,
    PreviewResult,
    StudentData,
    ValidationReport,
} from '../types/lab-config';

export type Role = 'student' | 'teacher';

interface LabState {
    dir: string | null;
    config: LabConfig | null;
    student: StudentData;
    activeLabId: string | null;
    role: Role | null;

    saving: boolean;
    lastSaved: string | null;
    previewPages: string[];
    previewError: string | null;
    exporting: boolean;
    validating: boolean;

    typstAvailable: boolean | null;
    typstMessage: string | null;

    init: () => Promise<void>;
    setRole: (r: Role) => Promise<void>;
    clearRole: () => Promise<void>;
    openDir: (path: string) => Promise<void>;
    setActiveLab: (id: string) => void;
    updateStudent: (patch: Partial<StudentData>) => void;

    setBlocks: (labId: string, blocks: Block[]) => void;
    addBlock: (labId: string, block: Block) => void;
    updateBlock: (labId: string, uid: string, patch: Partial<Block>) => void;
    removeBlock: (labId: string, uid: string) => void;
    moveBlock: (labId: string, from: number, to: number) => void;
    prependBlock: (labId: string, block: Block) => void;
    setDate: (labId: string, date: string | null) => void;

    saveNow: () => Promise<void>;
    importImage: (src: string) => Promise<ImportedImage>;
    refreshPreview: () => Promise<void>;
    validate: () => Promise<ValidationReport | null>;
    exportPdf: () => Promise<ExportResult | null>;
    checkTypst: () => Promise<void>;
    reset: () => void;
}

const emptyStudent: StudentData = {
    name: '',
    studentId: '',
    className: '',
    location: '',
    records: {},
    dates: {},
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

export const useLabStore = create<LabState>((set, get) => {
    const persist = async () => {
        const { dir, role } = get();
        try {
            await invoke('save_settings', {
                settings: { lastLabDir: dir, lastRole: role },
            });
        } catch (e) {
            console.warn('save settings failed', e);
        }
    };

    const scheduleSave = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => void get().saveNow(), 800);
    };

    const schedulePreview = () => {
        if (previewTimer) clearTimeout(previewTimer);
        previewTimer = setTimeout(() => void get().refreshPreview(), 800);
    };

    const applyBlocks = (labId: string, blocks: Block[]) => {
        set((s) => ({
            student: {
                ...s.student,
                records: { ...s.student.records, [labId]: blocks },
            },
        }));
        scheduleSave();
        schedulePreview();
    };

    return {
        dir: null,
        config: null,
        student: emptyStudent,
        activeLabId: null,
        role: null,

        saving: false,
        lastSaved: null,
        previewPages: [],
        previewError: null,
        exporting: false,
        validating: false,
        typstAvailable: null,
        typstMessage: null,

        init: async () => {
            try {
                const settings = await invoke<AppSettings>('load_settings');
                if (settings.lastRole === 'student' || settings.lastRole === 'teacher') {
                    set({ role: settings.lastRole });
                }
                if (settings.lastLabDir) {
                    try {
                        await get().openDir(settings.lastLabDir);
                    } catch {
                        // ignore
                    }
                }
            } catch (e) {
                console.warn('init failed', e);
            }
        },

        setRole: async (r) => {
            set({ role: r });
            await persist();
        },

        clearRole: async () => {
            set({
                role: null,
                dir: null,
                config: null,
                student: emptyStudent,
                activeLabId: null,
                previewPages: [],
                previewError: null,
                lastSaved: null,
            });
            await persist();
        },

        openDir: async (path) => {
            const session = await invoke<LabSession>('open_lab_dir', { path });
            const data = await invoke<StudentData>('load_student_data', {
                dir: session.dir,
                config: session.config,
                studentId: null,
            });

            set({
                dir: session.dir,
                config: session.config,
                student: data,
                activeLabId: session.config.experiments[0]?.id ?? null,
                previewPages: [],
                previewError: null,
            });

            await persist();
            void get().refreshPreview();
        },

        setActiveLab: (id) => set({ activeLabId: id }),

        updateStudent: (patch) => {
            set((s) => ({ student: { ...s.student, ...patch } }));
            scheduleSave();
            schedulePreview();
        },

        setBlocks: (labId, blocks) => applyBlocks(labId, blocks),

        addBlock: (labId, block) => {
            const current = get().student.records[labId] ?? [];
            applyBlocks(labId, [...current, block]);
        },

        prependBlock: (labId, block) => {
            const current = get().student.records[labId] ?? [];
            applyBlocks(labId, [block, ...current]);
        },

        updateBlock: (labId, uid, patch) => {
            const current = get().student.records[labId] ?? [];
            const next = current.map((b) =>
                b.uid === uid ? ({ ...b, ...patch } as Block) : b,
            );
            applyBlocks(labId, next);
        },

        removeBlock: (labId, uid) => {
            const current = get().student.records[labId] ?? [];
            applyBlocks(
                labId,
                current.filter((b) => b.uid !== uid),
            );
        },

        moveBlock: (labId, from, to) => {
            const current = [...(get().student.records[labId] ?? [])];
            const [moved] = current.splice(from, 1);
            current.splice(to, 0, moved);
            applyBlocks(labId, current);
        },

        setDate: (labId, date) => {
            set((s) => ({
                student: {
                    ...s.student,
                    dates: { ...s.student.dates, [labId]: date },
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
            const { dir, config, student } = get();
            if (!dir || !config) return;
            try {
                const result = await invoke<PreviewResult>('compile_preview', {
                    dir,
                    config,
                    data: student,
                });
                set({ previewPages: result.pages, previewError: null });
            } catch (e) {
                set({ previewError: String(e) });
            }
        },

        validate: async () => {
            const { config, student } = get();
            if (!config) return null;
            set({ validating: true });
            try {
                const report = await invoke<ValidationReport>('validate_report', {
                    config,
                    data: student,
                });
                set({ validating: false });
                return report;
            } catch (e) {
                set({ validating: false });
                throw e;
            }
        },

        exportPdf: async () => {
            const { dir, config, student } = get();
            if (!dir || !config) return null;
            set({ exporting: true });
            try {
                const result = await invoke<ExportResult>('export_pdf', {
                    dir,
                    config,
                    data: student,
                });
                set({ exporting: false });
                return result;
            } catch (e) {
                set({ exporting: false });
                throw e;
            }
        },

        checkTypst: async () => {
            try {
                const result = await invoke<{
                    available: boolean;
                    version: string | null;
                    message: string | null;
                }>('check_typst');
                set({
                    typstAvailable: result.available,
                    typstMessage: result.message,
                });
            } catch (e) {
                set({ typstAvailable: false, typstMessage: String(e) });
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
