import { ActionIcon, Group, Paper, Tooltip } from '@mantine/core';
import { EMPTY_BLOCKS } from '../utils/constants';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block } from '../types/lab-config';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { collectRefs, labelFor } from '../utils/block-utils';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { MathBlock } from './blocks/MathBlock';

export function BlockCard({ labId, block }: { labId: string; block: Block }) {
    const t = useT();
    const removeBlock = useLabStore((s) => s.removeBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: block.uid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // 未引用警告
    const refs = collectRefs(blocks);
    const label = labelFor(block);
    const hasTitle = block.type !== 'text' && block.title.trim() !== '';
    const unreferenced =
        block.type !== 'text' && hasTitle && !refs.has(block.title);

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            withBorder
            p="sm"
            bg={unreferenced ? 'yellow.0' : undefined}
        >
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Drag">
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            style={{ cursor: 'grab' }}
                            {...attributes}
                            {...listeners}
                        >
                            ⋮⋮
                        </ActionIcon>
                    </Tooltip>
                    {unreferenced && (
                        <Tooltip label={t('unreferencedWarning')}>
                            <span style={{ color: 'orange', cursor: 'help' }}>⚠</span>
                        </Tooltip>
                    )}
                    {label && (
                        <span style={{ fontSize: 11, color: 'var(--mantine-color-dimmed)' }}>
                            {label}
                        </span>
                    )}
                </Group>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeBlock(labId, block.uid)}
                    title={t('deleteBlock')}
                >
                    ✕
                </ActionIcon>
            </Group>

            {block.type === 'text' && <TextBlock labId={labId} block={block} />}
            {block.type === 'image' && <ImageBlock labId={labId} block={block} />}
            {block.type === 'code' && <CodeBlock labId={labId} block={block} />}
            {block.type === 'math' && <MathBlock labId={labId} block={block} />}
        </Paper>
    );
}