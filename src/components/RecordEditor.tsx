import { useEffect, useRef, useState } from 'react';
import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getCurrentWebview } from '@tauri-apps/api/webview';
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Experiment } from '../types/lab-config';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { EMPTY_BLOCKS, DEFAULT_CODE_LANGUAGES } from '../utils/constants';
import { processDroppedFiles } from '../utils/file-utils';
import { AddBlockMenu } from './AddBlockMenu';
import { BlockCard } from './BlockCard';

export function RecordEditor({ experiment }: { experiment: Experiment }) {
    const t = useT();
    const blocks = useLabStore(
        (s) => s.student.records[experiment.id] ?? EMPTY_BLOCKS,
    );
    const moveBlock = useLabStore((s) => s.moveBlock);

    const startRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const prevLenRef = useRef(blocks.length);
    const prevFirstUidRef = useRef(blocks[0]?.uid);
    const prevLastUidRef = useRef(blocks[blocks.length - 1]?.uid);

    const [dragOver, setDragOver] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    // 新增 block 后自动滚动：从顶部添加 → 滚到顶，从底部添加 → 滚到底
    useEffect(() => {
        const lenIncreased = blocks.length > prevLenRef.current;
        const firstChanged = blocks[0]?.uid !== prevFirstUidRef.current;
        const lastChanged = blocks[blocks.length - 1]?.uid !== prevLastUidRef.current;

        if (lenIncreased) {
            if (firstChanged) {
                requestAnimationFrame(() => {
                    startRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            } else if (lastChanged) {
                requestAnimationFrame(() => {
                    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                });
            }
        }

        prevLenRef.current = blocks.length;
        prevFirstUidRef.current = blocks[0]?.uid;
        prevLastUidRef.current = blocks[blocks.length - 1]?.uid;
    }, [blocks]);

    // 全局文件拖放监听
    useEffect(() => {
        let cancelled = false;
        let unlisten: (() => void) | null = null;

        void (async () => {
            const webview = getCurrentWebview();
            const fn = await webview.onDragDropEvent(async (event) => {
                if (cancelled) return;
                const p = event.payload;

                if (p.type === 'over') {
                    setDragOver(true);
                } else if (p.type === 'leave') {
                    setDragOver(false);
                } else if (p.type === 'drop') {
                    setDragOver(false);
                    if (p.paths.length === 0) return;

                    const state = useLabStore.getState();
                    const codeLangs = state.config?.codeLanguages ?? DEFAULT_CODE_LANGUAGES;
                    try {
                        const { blocks: newBlocks, unsupported } = await processDroppedFiles(
                            p.paths,
                            codeLangs,
                            state.importImage,
                        );
                        if (newBlocks.length > 0) {
                            const current = state.student.records[experiment.id] ?? [];
                            state.setBlocks(experiment.id, [...current, ...newBlocks]);
                        }
                        if (unsupported.length > 0) {
                            notifications.show({
                                color: 'yellow',
                                title: t('droppedSkipped'),
                                message: unsupported.join(', '),
                                autoClose: 6000,
                            });
                        }
                    } catch (e) {
                        notifications.show({
                            color: 'red',
                            title: 'Error',
                            message: String(e),
                        });
                    }
                }
            });
            if (cancelled) {
                fn();
            } else {
                unlisten = fn;
            }
        })();

        return () => {
            cancelled = true;
            if (unlisten) unlisten();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [experiment.id]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = blocks.findIndex((b) => b.uid === active.id);
        const to = blocks.findIndex((b) => b.uid === over.id);
        if (from < 0 || to < 0) return;
        moveBlock(experiment.id, from, to);
    };

    return (
        <Paper
            withBorder
            p="md"
            style={{
                outline: dragOver ? '2px dashed var(--mantine-color-blue-5)' : undefined,
                outlineOffset: dragOver ? 4 : undefined,
                transition: 'outline 120ms',
            }}
        >
            <Group justify="space-between" mb="xs">
                <Text fw={600}>{t('record')}</Text>
                <AddBlockMenu labId={experiment.id} position="start" />
            </Group>
            <Text size="xs" c="dimmed" mb="md">
                {t('dropFileHint')}
            </Text>

            <div ref={startRef} />

            {blocks.length === 0 ? (
                <Text c="dimmed" ta="center" py="lg">
                    {t('addBlock')} +
                </Text>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={blocks.map((b) => b.uid)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Stack gap="sm">
                            {blocks.map((b) => (
                                <BlockCard key={b.uid} labId={experiment.id} block={b} />
                            ))}
                        </Stack>
                    </SortableContext>
                </DndContext>
            )}

            <div ref={endRef} />

            {blocks.length > 0 && (
                <>
                    <Divider my="md" />
                    <Group justify="center">
                        <AddBlockMenu labId={experiment.id} position="end" />
                    </Group>
                </>
            )}
        </Paper>
    );
}