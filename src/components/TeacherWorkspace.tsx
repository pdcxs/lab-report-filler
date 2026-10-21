import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    Checkbox,
    Group,
    NumberInput,
    ScrollArea,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { IconGripVertical, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { LabConfig } from '../types/lab-config';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTeacherStore } from '../state/useTeacherStore';
import { useLabStore } from '../state/useLabStore';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { TeacherPreview } from './TeacherPreview';
import { CodeLanguagesEditor } from './CodeLanguagesEditor';
import { useT } from '../i18n/useT';
import { confirmDialog } from './modals';

interface TeacherExportResult {
    zipPath: string;
}

function toLines(arr: string[]): string {
    return arr.join('\n');
}
function fromLines(text: string): string[] {
    return text.split('\n').map((s) => s.replace(/\r$/, ''));
}

function SortableLabButton(props: {
    id: string;
    index: number;
    name: string;
    active: boolean;
    onClick: () => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: props.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    return (
        <Group ref={setNodeRef} style={style} gap="xs" wrap="nowrap">
            <UnstyledButton
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab', padding: '0 4px', color: 'var(--mantine-color-dimmed)' }}
                title="拖动排序"
            >
                <IconGripVertical size={16} />
            </UnstyledButton>
            <Button
                variant={props.active ? 'light' : 'subtle'}
                size="xs"
                style={{ flex: 1, justifyContent: 'flex-start' }}
                onClick={props.onClick}
            >
                {props.index + 1}. {props.name || '(未命名)'}
            </Button>
            <Button variant="subtle" size="xs" color="red" onClick={props.onRemove}>
                <IconX size={14} />
            </Button>
        </Group>
    );
}

export function TeacherWorkspace() {
    const clearRole = useLabStore((s) => s.clearRole);
    const t = useT();

    const init = useTeacherStore((s) => s.init);
    const loaded = useTeacherStore((s) => s.loaded);
    const config = useTeacherStore((s) => s.config);
    const activeIdx = useTeacherStore((s) => s.activeLabIndex);
    const updateCourse = useTeacherStore((s) => s.updateCourse);
    const setLanguage = useTeacherStore((s) => s.setLanguage);
    const updateStudentName = useTeacherStore((s) => s.updateStudentName);
    const updateStudentId = useTeacherStore((s) => s.updateStudentId);
    const setCodeLanguages = useTeacherStore((s) => s.setCodeLanguages);
    const updateExperiment = useTeacherStore((s) => s.updateExperiment);
    const addExperiment = useTeacherStore((s) => s.addExperiment);
    const removeExperiment = useTeacherStore((s) => s.removeExperiment);
    const reorderExperiments = useTeacherStore((s) => s.reorderExperiments);
    const setActiveLabIndex = useTeacherStore((s) => s.setActiveLabIndex);
    const newConfig = useTeacherStore((s) => s.newConfig);
    const loadConfig = useTeacherStore((s) => s.loadConfig);

    const [exporting, setExporting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [logoPath, setLogoPath] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        void init();
    }, [init]);

    const activeExp = config.experiments[activeIdx];

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = config.experiments.findIndex((e) => e.id === active.id);
        const to = config.experiments.findIndex((e) => e.id === over.id);
        if (from < 0 || to < 0) return;
        reorderExperiments(from, to);
    };

    const handleSaveTemplate = async () => {
        const defaultName = `${config.course.courseName.trim() || 'template'}.json`;
        const path = await save({
            defaultPath: defaultName,
            filters: [{ name: 'Template', extensions: ['json'] }],
        });
        if (typeof path !== 'string') return;

        try {
            const json = JSON.stringify(config, null, 2);
            await invoke('write_text_file', { path, content: json });
            notifications.show({
                color: 'green',
                title: '已保存',
                message: path,
                autoClose: 6000,
            });
        } catch (e) {
            notifications.show({
                color: 'red',
                title: '保存失败',
                message: String(e),
                autoClose: 8000,
            });
        }
    };

    const handleOpenTemplate = async () => {
        const path = await open({
            multiple: false,
            filters: [{ name: 'Template', extensions: ['json'] }],
        });
        if (typeof path !== 'string') return;

        try {
            const content = await invoke<string>('read_text_file', { path });
            const parsed = JSON.parse(content) as LabConfig;
            if (
                !parsed ||
                typeof parsed !== 'object' ||
                !Array.isArray(parsed.experiments)
            ) {
                throw new Error('不是有效的模板文件 / Not a valid template file');
            }

            const confirmed = await confirmDialog({
                title: '确认打开模板',
                message: (
                    <Stack gap="md">
                        <Text>打开模板会替换当前编辑的内容，是否继续？</Text>
                        <Text
                            size="xs"
                            c="dimmed"
                            style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}
                        >
                            {path}
                        </Text>
                    </Stack>
                ),
                confirmLabel: '确认替换',
                cancelLabel: '取消',
                confirmColor: 'red',
            });
            if (!confirmed) return;

            await loadConfig(parsed);
            notifications.show({
                color: 'green',
                title: '已打开',
                message: path,
                autoClose: 6000,
            });
        } catch (e) {
            notifications.show({
                color: 'red',
                title: '打开失败',
                message: String(e),
                autoClose: 8000,
            });
        }
    };

    const handleNewConfig = async () => {
        const confirmed = await confirmDialog({
            title: '确认新建',
            message: '新建会清空当前正在编辑的内容，是否继续？',
            confirmLabel: '确认新建',
            cancelLabel: '取消',
            confirmColor: 'red',
        });
        if (confirmed) await newConfig();
    };

    const handleExport = async () => {
        if (!config.course.courseName.trim()) {
            notifications.show({ color: 'red', title: '错误', message: '请填写课程名称。' });
            return;
        }
        if (config.experiments.length === 0) {
            notifications.show({ color: 'red', title: '错误', message: '至少需要一个实验。' });
            return;
        }

        const defaultName = `${config.course.courseName || 'lab-package'}.zip`;
        const zipPath = await save({
            defaultPath: defaultName,
            filters: [{ name: 'ZIP', extensions: ['zip'] }],
        });
        if (typeof zipPath !== 'string') return;

        setExporting(true);
        try {
            const result = await invoke<TeacherExportResult>('teacher_export', {
                zipPath,
                config,
                logoPath,
            });
            notifications.show({
                color: 'green',
                title: '导出成功',
                message: `ZIP：${result.zipPath}`,
                autoClose: 10000,
                styles: { description: { whiteSpace: 'pre-wrap' } },
            });
        } catch (e) {
            notifications.show({
                color: 'red',
                title: '导出失败',
                message: String(e),
                autoClose: 10000,
            });
        } finally {
            setExporting(false);
        }
    };

    if (!loaded) {
        return <Box p="md">加载中…</Box>;
    }

    return (
        <>
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Box
                    p="xs"
                    px="md"
                    style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}
                >
                    <Group justify="space-between">
                        <Text fw={600}>教师模式</Text>
                        <Group gap="sm">
                            <Button
                                variant="default"
                                size="xs"
                                onClick={async () => {
                                    const p = await open({
                                        multiple: false,
                                        filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
                                    });
                                    if (typeof p === 'string') setLogoPath(p);
                                }}
                            >
                                {logoPath ? '更换 Logo' : '选择 Logo'}
                            </Button>
                            {logoPath && (
                                <Button variant="subtle" size="xs" onClick={() => setLogoPath(null)}>
                                    用默认
                                </Button>
                            )}
                            <Button variant="default" size="xs" onClick={() => setPreviewOpen((v) => !v)}>
                                {previewOpen ? '关闭预览' : '打开预览'}
                            </Button>
                            <Button variant="subtle" size="xs" onClick={() => void handleNewConfig()}>
                                新建
                            </Button>
                            <Button variant="subtle" size="xs" onClick={() => void handleOpenTemplate()}>打开模板</Button>
                            <Button variant="subtle" size="xs" onClick={() => void handleSaveTemplate()}>保存模板</Button>
                            <Button variant="subtle" size="xs" onClick={() => void clearRole()}>
                                切换身份
                            </Button>
                            <Button
                                variant="light"
                                size="xs"
                                loading={exporting}
                                onClick={() => void handleExport()}
                            >
                                导出 ZIP
                            </Button>
                            <ColorSchemeToggle />
                        </Group>
                    </Group>
                </Box>

                <Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0 }} wrap="nowrap">
                    <Box
                        w={240}
                        p="md"
                        style={{
                            borderRight: '1px solid var(--mantine-color-gray-3)',
                            overflowY: 'auto',
                            flexShrink: 0,
                        }}
                    >
                        <Title order={5} mb="sm">
                            实验列表
                        </Title>
                        <Stack gap="xs">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={config.experiments.map((e) => e.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <Stack gap="xs">
                                        {config.experiments.map((exp, i) => (
                                            <SortableLabButton
                                                key={exp.id}
                                                id={exp.id}
                                                index={i}
                                                name={exp.name}
                                                active={i === activeIdx}
                                                onClick={() => setActiveLabIndex(i)}
                                                onRemove={() => removeExperiment(i)}
                                            />
                                        ))}
                                    </Stack>
                                </SortableContext>
                            </DndContext>
                            <Button variant="default" size="xs" onClick={addExperiment}>
                                + 添加实验
                            </Button>
                        </Stack>
                    </Box>

                    <ScrollArea style={{ flex: 1, minWidth: 0 }}>
                        <Stack p="md" gap="md">
                            <Card withBorder>
                                <Title order={5} mb="sm">
                                    课程信息
                                </Title>
                                <Stack gap="sm">
                                    <TextInput
                                        label="课程名称"
                                        value={config.course.courseName}
                                        onChange={(e) => updateCourse({ courseName: e.currentTarget.value })}
                                    />
                                    <TextInput
                                        label="指导教师"
                                        value={config.course.teacherName}
                                        onChange={(e) => updateCourse({ teacherName: e.currentTarget.value })}
                                    />
                                    <TextInput
                                        label="默认班级（学生可改）"
                                        value={config.course.className}
                                        onChange={(e) => updateCourse({ className: e.currentTarget.value })}
                                    />
                                    <TextInput
                                        label="默认实验地点（学生可改）"
                                        value={config.course.location}
                                        onChange={(e) => updateCourse({ location: e.currentTarget.value })}
                                    />
                                    <Select
                                        label="界面语言"
                                        data={[
                                            { value: 'zh', label: '中文' },
                                            { value: 'en', label: 'English' },
                                        ]}
                                        value={config.language}
                                        onChange={(v) => v && setLanguage(v as 'zh' | 'en')}
                                    />
                                    <Stack gap={4}>
                                        <Text size="sm" fw={500}>{t('codeLanguagesLabel')}</Text>
                                        <CodeLanguagesEditor
                                            value={config.codeLanguages}
                                            onChange={(v) => setCodeLanguages(v)}
                                        />
                                    </Stack>
                                </Stack>
                            </Card>

                            <Card withBorder>
                                <Title order={5} mb="sm">
                                    学生字段配置
                                </Title>
                                <Stack gap="sm">
                                    <Text size="xs" c="dimmed">
                                        姓名、学号、班级、地点的标签和提示文字由界面语言自动决定，切换语言时会自动更新。以下选项对两个语言都生效。
                                    </Text>
                                    <Group grow>
                                        <NumberInput
                                            label="姓名最小长度"
                                            min={1}
                                            value={config.student.name.minLength}
                                            onChange={(v) =>
                                                updateStudentName({ minLength: typeof v === 'number' ? v : 2 })
                                            }
                                        />
                                        <NumberInput
                                            label="姓名最大长度"
                                            min={1}
                                            value={config.student.name.maxLength}
                                            onChange={(v) =>
                                                updateStudentName({ maxLength: typeof v === 'number' ? v : 20 })
                                            }
                                        />
                                    </Group>
                                    <Checkbox
                                        label="姓名必须包含中文字符"
                                        checked={config.student.name.requireCjk}
                                        onChange={(e) =>
                                            updateStudentName({ requireCjk: e.currentTarget.checked })
                                        }
                                    />
                                    <TextInput
                                        label="学号匹配规则（正则表达式）"
                                        value={config.student.studentId.pattern}
                                        onChange={(e) =>
                                            updateStudentId({ pattern: e.currentTarget.value })
                                        }
                                    />
                                </Stack>
                            </Card>

                            {activeExp && (
                                <Card withBorder>
                                    <Title order={5} mb="sm">
                                        实验：{activeExp.name || '(未命名)'}
                                    </Title>
                                    <Stack gap="sm">
                                        <TextInput
                                            label="实验名称"
                                            value={activeExp.name}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, { name: e.currentTarget.value })
                                            }
                                        />
                                        <Textarea
                                            label="实验目的和要求（Typst 源码，例如：+ 目的1）"
                                            autosize
                                            minRows={3}
                                            value={activeExp.objectives}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, { objectives: e.currentTarget.value })
                                            }
                                            styles={{
                                                input: { fontFamily: 'ui-monospace, monospace', fontSize: 13 },
                                            }}
                                        />
                                        <Textarea
                                            label="实验内容（Typst 源码）"
                                            autosize
                                            minRows={3}
                                            value={activeExp.content}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, { content: e.currentTarget.value })
                                            }
                                            styles={{
                                                input: { fontFamily: 'ui-monospace, monospace', fontSize: 13 },
                                            }}
                                        />
                                        <TextInput
                                            label="实验仪器和设备"
                                            value={activeExp.instrument}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, { instrument: e.currentTarget.value })
                                            }
                                        />
                                        <Textarea
                                            label="记录指导（每行一条）"
                                            autosize
                                            minRows={3}
                                            value={toLines(activeExp.recordGuide)}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, {
                                                    recordGuide: fromLines(e.currentTarget.value),
                                                })
                                            }
                                        />
                                        <TextInput
                                            label="编辑框占位提示"
                                            value={activeExp.placeholder}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, { placeholder: e.currentTarget.value })
                                            }
                                        />
                                        <Group grow>
                                            <NumberInput
                                                label="最少代码块数量"
                                                min={0}
                                                value={activeExp.validation.minCodeBlocks}
                                                onChange={(v) =>
                                                    updateExperiment(activeIdx, {
                                                        validation: {
                                                            ...activeExp.validation,
                                                            minCodeBlocks: typeof v === 'number' ? v : 0,
                                                        },
                                                    })
                                                }
                                            />
                                            <NumberInput
                                                label="最少图片数量"
                                                min={0}
                                                value={activeExp.validation.minFigures}
                                                onChange={(v) =>
                                                    updateExperiment(activeIdx, {
                                                        validation: {
                                                            ...activeExp.validation,
                                                            minFigures: typeof v === 'number' ? v : 0,
                                                        },
                                                    })
                                                }
                                            />
                                            <NumberInput
                                                label="最少文本块数量"
                                                min={0}
                                                value={activeExp.validation.minTextBlocks}
                                                onChange={(v) =>
                                                    updateExperiment(activeIdx, {
                                                        validation: {
                                                            ...activeExp.validation,
                                                            minTextBlocks: typeof v === 'number' ? v : 0,
                                                        },
                                                    })
                                                }
                                            />
                                        </Group>
                                        <NumberInput
                                            label="最少文字说明字符数（所有文本块合计）"
                                            min={0}
                                            value={activeExp.validation.minProseChars}
                                            onChange={(v) =>
                                                updateExperiment(activeIdx, {
                                                    validation: {
                                                        ...activeExp.validation,
                                                        minProseChars: typeof v === 'number' ? v : 0,
                                                    },
                                                })
                                            }
                                        />
                                        <Checkbox
                                            label="所有图片/代码/公式都必须被引用（有标题就必须在正文 [[标题]] 引用）"
                                            checked={activeExp.validation.requireAllReferenced}
                                            onChange={(e) =>
                                                updateExperiment(activeIdx, {
                                                    validation: {
                                                        ...activeExp.validation,
                                                        requireAllReferenced: e.currentTarget.checked,
                                                    },
                                                })
                                            }
                                        />
                                    </Stack>
                                </Card>
                            )}
                        </Stack>
                    </ScrollArea>

                    {previewOpen && <TeacherPreview logoPath={logoPath} />}
                </Group>
            </Box>
        </>
    );
}