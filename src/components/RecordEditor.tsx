import { useEffect, useRef } from 'react';
import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
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
import { EMPTY_BLOCKS } from '../utils/constants';
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = blocks.findIndex((b) => b.uid === active.id);
        const to = blocks.findIndex((b) => b.uid === over.id);
        if (from < 0 || to < 0) return;
        moveBlock(experiment.id, from, to);
    };

    return (
        <Paper withBorder p="md">
            <Group justify="space-between" mb="md">
                <Text fw={600}>{t('record')}</Text>
                <AddBlockMenu labId={experiment.id} position="start" />
            </Group>

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