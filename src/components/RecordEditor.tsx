import { Group, Paper, Stack, Text } from '@mantine/core';
import { EMPTY_BLOCKS } from '../utils/constants';
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
import { AddBlockMenu } from './AddBlockMenu';
import { BlockCard } from './BlockCard';

export function RecordEditor({ experiment }: { experiment: Experiment }) {
    const t = useT();
    const blocks = useLabStore(
        (s) => s.student.records[experiment.id] ?? EMPTY_BLOCKS,
    );
    const moveBlock = useLabStore((s) => s.moveBlock);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

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
                <AddBlockMenu labId={experiment.id} />
            </Group>

            {blocks.length === 0 ? (
                <Text c="dimmed" ta="center" py="lg">
                    {t('addBlock')} +
                </Text>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        </Paper>
    );
}