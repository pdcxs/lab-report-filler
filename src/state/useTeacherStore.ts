import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    CourseConfig,
    Experiment,
    LabConfig,
    SimpleFieldConfig,
    StudentConfig,
    StudentIdConfig,
    StudentNameConfig,
    TypstConfig,
    ValidationRules,
} from '../types/lab-config';

function defaultTypst(): TypstConfig {
    return {
        preamble: [
            '#import "@preview/pointless-size:0.1.1": zh',
            '#import "@preview/cuti:0.3.0": show-cn-fakebold',
            '#import "utils/utils.typ": cover',
            '#import "@preview/codly:1.3.0": codly-init',
            '',
            '#show: show-cn-fakebold',
            '#show: codly-init',
            '',
            '#set page(',
            '  margin: (top: 2.54cm, bottom: 2.54cm, left: 3.18cm, right: 3.18cm),',
            '  paper: "a4",',
            ')',
            '',
            '#let your-name = "{{studentName}}"',
            '#let your-id   = "{{studentId}}"',
            '',
        ],
        experimentSection: [
            '#let experiment-name = "{{experimentName}}"',
            '#cover(',
            '  lecture-name: "{{courseName}}",',
            '  experiment: experiment-name,',
            '  student-name: your-name,',
            '  student-id: your-id,',
            '  class-name: "{{className}}",',
            '  teacher-name: "{{teacherName}}",',
            '  experiment-location: "{{location}}",',
            ')',
            '',
            '#pagebreak()',
            '',
            '#set page(numbering: "1")',
            '#set text(font: ("Times New Roman", "KaiTi"), size: zh(4))',
            '#set par(first-line-indent: (amount: 2em, all: true), justify: true)',
            '#counter(page).update(1)',
            '',
            '#table(',
            '  columns: (1.5fr, 3fr),',
            '  [*实验名称*], [*{{experimentName}}*],',
            '  table.cell(colspan: 2)[*实验目的和要求*],',
            '  table.cell(colspan: 2)[',
            '{{objectivesBlock}}',
            '  ],',
            '  table.cell(colspan: 2)[*实验内容*],',
            '  table.cell(colspan: 2)[',
            '{{contentBlock}}',
            '  ],',
            '  [*实验仪器和设备*], [{{instrument}}],',
            '  table.cell(colspan: 2)[*实验记录（写出与实验内容对应的代码和运行结果）*],',
            '  table.cell(colspan: 2, breakable: true)[',
            '{{recordBlock}}',
            '  ],',
            ')',
            '',
        ],
    };
}

function defaultValidation(): ValidationRules {
    return {
        requireCodeBlock: true,
        requireFigure: true,
        requireFigureReference: true,
        minProseChars: 50,
    };
}

function defaultStudentName(): StudentNameConfig {
    return {
        label: '中文姓名',
        placeholder: '例如：张三',
        hint: '必须至少包含一个中文字符。',
        minLength: 2,
        maxLength: 20,
        requireCjk: true,
    };
}

function defaultStudentId(): StudentIdConfig {
    return {
        label: '学号',
        placeholder: '例如：00123400',
        pattern: '^[A-Za-z0-9]{4,20}$',
    };
}

function defaultClassName(): SimpleFieldConfig {
    return { label: '班级', placeholder: '例如：计算机LY2501' };
}

function defaultLocation(): SimpleFieldConfig {
    return { label: '实验地点', placeholder: '例如：E206' };
}

function defaultStudent(): StudentConfig {
    return {
        name: defaultStudentName(),
        studentId: defaultStudentId(),
        className: defaultClassName(),
        location: defaultLocation(),
    };
}

function newLabId(existing: Experiment[]): string {
    let i = existing.length + 1;
    const used = new Set(existing.map((e) => e.id));
    while (used.has(`lab${i}`)) i += 1;
    return `lab${i}`;
}

function newExperiment(existing: Experiment[]): Experiment {
    return {
        id: newLabId(existing),
        name: '新实验',
        objectives: '+ 实验目的 1\n+ 实验目的 2',
        content: '+ 实验内容 1\n+ 实验内容 2',
        instrument: '电脑',
        recordGuide: [''],
        placeholder: '在此撰写实验代码、运行结果与分析。',
        example: '',
        validation: defaultValidation(),
    };
}

function emptyConfig(): LabConfig {
    return {
        version: '1.0.0',
        language: 'zh',
        storage: {
            dataFileNamePattern: 'report-{studentId}.json',
            draftFileName: 'report-draft.json',
            generatedTypstNamePattern: 'report-{studentId}.typ',
            imagesFolder: 'images',
        },
        export: {
            fileNamePattern: '{studentName} - {studentId}.pdf',
            overwriteSilently: true,
            requireFileClosed: true,
        },
        course: { courseName: '', teacherName: '', className: '', location: '' },
        student: defaultStudent(),
        typst: defaultTypst(),
        experiments: [],
        codeLanguages: ['java', 'python', 'c', 'cpp', 'csharp', 'javascript', 'typescript', 'text'],
    };
}

interface TeacherState {
    config: LabConfig;
    activeLabIndex: number;
    loaded: boolean;

    init: () => Promise<void>;
    newConfig: () => Promise<void>;
    updateCourse: (patch: Partial<CourseConfig>) => void;
    setLanguage: (lang: 'zh' | 'en') => void;
    updateStudentName: (patch: Partial<StudentNameConfig>) => void;
    updateStudentId: (patch: Partial<StudentIdConfig>) => void;
    updateClassName: (patch: Partial<SimpleFieldConfig>) => void;
    updateLocation: (patch: Partial<SimpleFieldConfig>) => void;
    setCodeLanguages: (langs: string[]) => void;
    updateExperiment: (idx: number, patch: Partial<Experiment>) => void;
    addExperiment: () => void;
    removeExperiment: (idx: number) => void;
    reorderExperiments: (from: number, to: number) => void;
    setActiveLabIndex: (idx: number) => void;
}

let teacherSaveTimer: ReturnType<typeof setTimeout> | null = null;

export const useTeacherStore = create<TeacherState>((set, get) => {
    const scheduleSave = () => {
        if (teacherSaveTimer) clearTimeout(teacherSaveTimer);
        teacherSaveTimer = setTimeout(() => {
            void invoke('save_teacher_draft', { config: get().config }).catch((e) =>
                console.warn('save teacher draft failed', e),
            );
        }, 800);
    };

    const updateConfig = (patch: Partial<LabConfig>) => {
        set((s) => ({ config: { ...s.config, ...patch } }));
        scheduleSave();
    };

    return {
        config: emptyConfig(),
        activeLabIndex: 0,
        loaded: false,

        init: async () => {
            try {
                const draft = await invoke<LabConfig | null>('load_teacher_draft');
                if (draft) {
                    set({ config: draft, loaded: true });
                    return;
                }
            } catch (e) {
                console.warn('load teacher draft failed', e);
            }
            set({ loaded: true });
        },

        newConfig: async () => {
            set({ config: emptyConfig(), activeLabIndex: 0 });
            try {
                await invoke('clear_teacher_draft');
            } catch (e) {
                console.warn('clear teacher draft failed', e);
            }
            scheduleSave();
        },

        updateCourse: (patch) => updateConfig({ course: { ...get().config.course, ...patch } }),

        setLanguage: (lang) => updateConfig({ language: lang }),

        updateStudentName: (patch) =>
            updateConfig({
                student: {
                    ...get().config.student,
                    name: { ...get().config.student.name, ...patch },
                },
            }),

        updateStudentId: (patch) =>
            updateConfig({
                student: {
                    ...get().config.student,
                    studentId: { ...get().config.student.studentId, ...patch },
                },
            }),

        updateClassName: (patch) =>
            updateConfig({
                student: {
                    ...get().config.student,
                    className: { ...get().config.student.className, ...patch },
                },
            }),

        updateLocation: (patch) =>
            updateConfig({
                student: {
                    ...get().config.student,
                    location: { ...get().config.student.location, ...patch },
                },
            }),

        setCodeLanguages: (langs) => updateConfig({ codeLanguages: langs }),

        updateExperiment: (idx, patch) => {
            const experiments = get().config.experiments.map((e, i) =>
                i === idx ? { ...e, ...patch } : e,
            );
            updateConfig({ experiments });
        },

        addExperiment: () => {
            const experiments = [
                ...get().config.experiments,
                newExperiment(get().config.experiments),
            ];
            set({ activeLabIndex: experiments.length - 1 });
            updateConfig({ experiments });
        },

        removeExperiment: (idx) => {
            const experiments = get().config.experiments.filter((_, i) => i !== idx);
            const activeLabIndex = Math.max(0, Math.min(get().activeLabIndex, experiments.length - 1));
            set({ activeLabIndex });
            updateConfig({ experiments });
        },

        reorderExperiments: (from, to) => {
            const experiments = [...get().config.experiments];
            const [moved] = experiments.splice(from, 1);
            experiments.splice(to, 0, moved);
            set({ activeLabIndex: to });
            updateConfig({ experiments });
        },

        setActiveLabIndex: (idx) => set({ activeLabIndex: idx }),
    };
});