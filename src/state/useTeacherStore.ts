import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    CodeLanguage,
    CourseConfig,
    Experiment,
    LabConfig,
    SimpleFieldConfig,
    StudentIdConfig,
    StudentNameConfig,
    TypstConfig,
    ValidationRules,
} from '../types/lab-config';

// =====================================================================
// 默认模板
// =====================================================================

function defaultTypst(): TypstConfig {
    return {
        preamble: [
            '#import "@preview/pointless-size:0.1.1": zh',
            '#import "@preview/cuti:0.3.0": show-cn-fakebold',
            '#import "utils/utils.typ": cover',
            '#import "@preview/codly:2.0.0" as codly',
            '#show raw.where(block: true): codly.new',
            '#set math.equation(numbering: "(1)")',
            '#set page(',
            '  margin: (top: 2.54cm, bottom: 2.54cm, left: 3.18cm, right: 3.18cm),',
            '  paper: "a4",',
            ')',
            '#let your-name = "{{studentName}}"',
            '#let your-id   = "{{studentId}}"',
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
            '{{dateLine}}',
            ')',
            '#pagebreak()',
            '#show figure.where(kind: raw): set block(breakable: true)',
            '#set page(numbering: "1")',
            '#set text(font: ("Times New Roman", "KaiTi"), size: zh(4))',
            '#set par(first-line-indent: (amount: 2em, all: true), justify: true)',
            '#counter(page).update(1)',
            '#counter(figure).update(0)',
            '#counter(figure.where(kind: image)).update(0)',
            '#counter(figure.where(kind: raw)).update(0)',
            '#counter(math.equation).update(0)',
            '#counter(footnote).update(0)',
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
        requireAllReferenced: true,
        minCodeBlocks: 1,
        minFigures: 1,
        minTextBlocks: 1,
        minProseChars: 50,
    };
}

// =====================================================================
// 字段配置（按语言）
// =====================================================================

function defaultStudentName(lang: 'zh' | 'en'): StudentNameConfig {
    return lang === 'zh'
        ? {
            label: '中文姓名',
            placeholder: '例如：张三',
            hint: '必须至少包含一个中文字符。',
            minLength: 2,
            maxLength: 20,
            requireCjk: true,
        }
        : {
            label: 'Chinese Name',
            placeholder: 'eg. 张三',
            hint: 'Must contain at least one Chinese character.',
            minLength: 2,
            maxLength: 20,
            requireCjk: true,
        };
}

function defaultStudentId(lang: 'zh' | 'en'): StudentIdConfig {
    return lang === 'zh'
        ? {
            label: '学号',
            placeholder: '例如：00123400',
            pattern: '^[A-Za-z0-9]{4,20}$',
        }
        : {
            label: 'Student ID',
            placeholder: 'eg. 00123400',
            pattern: '^[A-Za-z0-9]{4,20}$',
        };
}

function defaultClassName(lang: 'zh' | 'en'): SimpleFieldConfig {
    return lang === 'zh'
        ? { label: '班级', placeholder: '例如：计算机LY2501' }
        : { label: 'Class', placeholder: 'eg. 计算机LY2501' };
}

function defaultLocation(lang: 'zh' | 'en'): SimpleFieldConfig {
    return lang === 'zh'
        ? { label: '实验地点', placeholder: '例如：E206' }
        : { label: 'Location', placeholder: 'eg. E206' };
}

// =====================================================================
// 构造器
// =====================================================================

function newLabId(existing: Experiment[]): string {
    let i = existing.length + 1;
    const used = new Set(existing.map((e) => e.id));
    while (used.has(`lab${i}`)) i += 1;
    return `lab${i}`;
}

function newExperiment(existing: Experiment[], lang: 'zh' | 'en'): Experiment {
    const isZh = lang === 'zh';
    return {
        id: newLabId(existing),
        name: isZh ? '新实验' : 'New Experiment',
        objectives: isZh ? '+ 实验目的 1\n+ 实验目的 2' : '+ Objective 1\n+ Objective 2',
        content: isZh ? '+ 实验内容 1\n+ 实验内容 2' : '+ Task 1\n+ Task 2',
        instrument: isZh ? '电脑' : 'Computer',
        recordGuide: isZh
            ? ['说明记录里应包含什么（每行一条）']
            : ['Describe what the record should contain (one per line)'],
        placeholder: isZh
            ? '在此撰写实验代码、运行结果与分析。'
            : 'Write your experiment code, run results, and analysis here.',
        validation: defaultValidation(),
    };
}

function emptyConfig(lang: 'zh' | 'en' = 'zh'): LabConfig {
    return {
        version: '1.0.0',
        language: lang,
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
        course: {
            courseName: '',
            teacherName: '',
            className: '',
            location: '',
        },
        student: {
            name: defaultStudentName(lang),
            studentId: defaultStudentId(lang),
            className: defaultClassName(lang),
            location: defaultLocation(lang),
        },
        typst: defaultTypst(),
        experiments: [],
        codeLanguages: defaultCodeLanguages(),
    };
}

function defaultCodeLanguages(): CodeLanguage[] {
    return [
        { name: 'java' },
        { name: 'python' },
        { name: 'c' },
        { name: 'cpp' },
        { name: 'csharp' },
        { name: 'javascript' },
        { name: 'typescript' },
        { name: 'text' },
    ];
}

// =====================================================================
// Store
// =====================================================================

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
    setCodeLanguages: (langs: CodeLanguage[]) => void;
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
            const lang = get().config.language;
            set({ config: emptyConfig(lang), activeLabIndex: 0 });
            try {
                await invoke('clear_teacher_draft');
            } catch (e) {
                console.warn('clear teacher draft failed', e);
            }
            scheduleSave();
        },

        updateCourse: (patch) =>
            updateConfig({ course: { ...get().config.course, ...patch } }),

        // 切换语言时：
        // - 更新界面语言
        // - 重置学生字段的标签与 placeholder
        // - 重置所有实验的 example 为对应语言的默认示例
        // - 保留 name / studentId / className / location 的其他配置（用户可能改过 pattern 等）
        setLanguage: (lang) => {
            const config = get().config;
            const nameDefault = defaultStudentName(lang);
            const idDefault = defaultStudentId(lang);
            const classDefault = defaultClassName(lang);
            const locDefault = defaultLocation(lang);

            set({
                config: {
                    ...config,
                    language: lang,
                    student: {
                        name: {
                            ...nameDefault,
                            minLength: config.student.name.minLength,
                            maxLength: config.student.name.maxLength,
                            requireCjk: config.student.name.requireCjk,
                        },
                        studentId: {
                            ...idDefault,
                            pattern: config.student.studentId.pattern,
                        },
                        className: classDefault,
                        location: locDefault,
                    },
                    experiments: config.experiments.map((exp) => ({
                        ...exp,
                    })),
                },
            });
            scheduleSave();
        },

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
                newExperiment(get().config.experiments, get().config.language),
            ];
            set({ activeLabIndex: experiments.length - 1 });
            updateConfig({ experiments });
        },

        removeExperiment: (idx) => {
            const experiments = get().config.experiments.filter((_, i) => i !== idx);
            const activeLabIndex = Math.max(
                0,
                Math.min(get().activeLabIndex, experiments.length - 1),
            );
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
