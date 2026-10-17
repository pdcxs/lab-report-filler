import { ActionIcon, Code, Group, Paper, Text, Tooltip } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    IconAlertTriangle,
    IconGripVertical,
    IconX,
} from '@tabler/icons-react';
import type { Block } from '../types/lab-config';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { unreferencedBlocks } from '../utils/block-utils';
import { EMPTY_BLOCKS } from '../utils/constants';
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

    const unreferenced = unreferencedBlocks(blocks).some((b) => b.uid === block.uid);

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            withBorder
            p="sm"
            bg={unreferenced ? 'yellow.0' : undefined}
        >
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Tooltip label="Drag">
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            style={{ cursor: 'grab' }}
                            {...attributes}
                            {...listeners}
                        >
                            <IconGripVertical size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {block.type !== 'text' && (
                        <Code>{block.uid}</Code>
                    )}
                    {unreferenced && (
                        <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                            <IconAlertTriangle size={16} color="orange" />
                            <Text
                                size="xs"
                                c="orange"
                                lineClamp={1}
                                title={t('unreferencedWarning')}
                            >
                                {t('unreferencedWarning')}
                            </Text>
                        </Group>
                    )}
                </Group>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeBlock(labId, block.uid)}
                    title={t('deleteBlock')}
                >
                    <IconX size={16} />
                </ActionIcon>
            </Group>

            {block.type === 'text' && <TextBlock labId={labId} block={block} />}
            {block.type === 'image' && <ImageBlock labId={labId} block={block} />}
            {block.type === 'code' && <CodeBlock labId={labId} block={block} />}
            {block.type === 'math' && <MathBlock labId={labId} block={block} />}
        </Paper>
    );
}