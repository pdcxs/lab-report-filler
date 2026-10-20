import { useState } from 'react';
import { ActionIcon, Box, Code, Group, Paper, Text, Tooltip } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    IconAlertTriangle,
    IconChevronDown,
    IconChevronUp,
    IconCode,
    IconGripVertical,
    IconHeading,
    IconMathFunction,
    IconPhoto,
    IconTextSize,
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
import { HeadingBlock } from './blocks/HeadingBlock';

function firstChars(s: string, n = 40): string {
    return s.replace(/\s+/g, ' ').trim().slice(0, n);
}

function BlockIcon({ block }: { block: Block }) {
    switch (block.type) {
        case 'text':
            return <IconTextSize size={16} />;
        case 'heading':
            return <IconHeading size={16} />;
        case 'image':
            return <IconPhoto size={16} />;
        case 'code':
            return <IconCode size={16} />;
        case 'math':
            return <IconMathFunction size={16} />;
    }
}

function CollapsedSummary({ block }: { block: Block }) {
    if (block.type === 'text') {
        return (
            <Text size="sm" lineClamp={1}>
                {firstChars(block.content) || '(empty)'}
            </Text>
        );
    }
    if (block.type === 'heading') {
        return (
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                <Code>H{block.level}</Code>
                <Text size="sm" lineClamp={1}>
                    {block.content || '(empty)'}
                </Text>
            </Group>
        );
    }
    if (block.type === 'math' && !block.title.trim()) {
        return (
            <Text size="sm" lineClamp={1}>
                {firstChars(block.formula) || '(empty)'}
            </Text>
        );
    }
    const title = block.title.trim() || '(untitled)';
    return (
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <Code>{block.uid}</Code>
            <Text size="sm" lineClamp={1}>
                · {title}
            </Text>
        </Group>
    );
}

export function BlockCard({ labId, block }: { labId: string; block: Block }) {
    const t = useT();
    const removeBlock = useLabStore((s) => s.removeBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: block.uid });

    const [collapsed, setCollapsed] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const unreferenced = unreferencedBlocks(blocks).some((b) => b.uid === block.uid);
    const showUid = block.type !== 'text' && block.type !== 'heading';

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            withBorder
            p="sm"
            bg={unreferenced ? 'yellow.0' : undefined}
        >
            <Group justify="space-between" mb={collapsed ? 0 : 'xs'} wrap="nowrap">
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
                    <BlockIcon block={block} />
                    {collapsed ? (
                        <CollapsedSummary block={block} />
                    ) : (
                        showUid && <Code>{block.uid}</Code>
                    )}
                    {unreferenced && (
                        <Tooltip label={t('unreferencedWarning')}>
                            <IconAlertTriangle size={16} color="orange" style={{ flexShrink: 0 }} />
                        </Tooltip>
                    )}
                </Group>
                <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Tooltip label={collapsed ? t('expandBlock') : t('collapseBlock')}>
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => setCollapsed((c) => !c)}
                        >
                            {collapsed ? (
                                <IconChevronDown size={16} />
                            ) : (
                                <IconChevronUp size={16} />
                            )}
                        </ActionIcon>
                    </Tooltip>
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
            </Group>

            {!collapsed && (
                <Box>
                    {block.type === 'text' && <TextBlock labId={labId} block={block} />}
                    {block.type === 'image' && <ImageBlock labId={labId} block={block} />}
                    {block.type === 'code' && <CodeBlock labId={labId} block={block} />}
                    {block.type === 'math' && <MathBlock labId={labId} block={block} />}
                    {block.type === 'heading' && <HeadingBlock labId={labId} block={block} />}
                </Box>
            )}
        </Paper>
    );
}