import {
    Alert,
    Button,
    Code,
    Menu,
    Stack,
    Text,
    Textarea,
} from '@mantine/core';
import { useRef } from 'react';
import {
    IconAlertTriangle,
    IconCode,
    IconMathFunction,
    IconPhoto,
} from '@tabler/icons-react';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { EMPTY_BLOCKS } from '../../utils/constants';
import { ambiguousRefsInText, exactRefText } from '../../utils/block-utils';

type TitledBlock = Extract<Block, { type: 'image' | 'code' | 'math' }>;

function hasTitle(b: Block): b is TitledBlock {
    if (b.type === 'text') return false;
    return b.title.trim() !== '';
}

export function TextBlock({
    labId,
    block,
}: {
    labId: string;
    block: Extract<Block, { type: 'text' }>;
}) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const referenceables = blocks.filter(hasTitle);
    const ambiguous = ambiguousRefsInText(block.content, blocks);

    const insertAtCursor = (text: string) => {
        const el = textareaRef.current;
        if (!el) {
            updateBlock(labId, block.uid, {
                content: block.content + text,
            } as Partial<Block>);
            return;
        }
        const start = el.selectionStart ?? block.content.length;
        const end = el.selectionEnd ?? block.content.length;
        const next = block.content.slice(0, start) + text + block.content.slice(end);
        updateBlock(labId, block.uid, { content: next } as Partial<Block>);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + text.length;
            el.setSelectionRange(pos, pos);
        });
    };

    return (
        <Stack gap="xs">
            <Textarea
                ref={textareaRef}
                autosize
                minRows={2}
                maxRows={30}
                value={block.content}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        content: e.currentTarget.value,
                    } as Partial<Block>)
                }
                placeholder={t('blockTextHint')}
                styles={{ input: { fontSize: 13, lineHeight: 1.6 } }}
            />

            {ambiguous.length > 0 && (
                <Alert
                    color="orange"
                    variant="light"
                    icon={<IconAlertTriangle size={16} />}
                    p="xs"
                >
                    <Text size="xs">
                        {t('ambiguousRefWarning')}{' '}
                        {ambiguous.map((title, i) => (
                            <span key={title}>
                                <Code>{`[[${title}]]`}</Code>
                                {i < ambiguous.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </Text>
                </Alert>
            )}

            <Menu shadow="md" position="bottom-start" withinPortal>
                <Menu.Target>
                    <Button
                        variant="light"
                        size="xs"
                        disabled={referenceables.length === 0}
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {t('insertReference')}
                    </Button>
                </Menu.Target>
                <Menu.Dropdown>
                    {referenceables.map((b) => {
                        const Icon =
                            b.type === 'image'
                                ? IconPhoto
                                : b.type === 'code'
                                    ? IconCode
                                    : IconMathFunction;
                        const refText = exactRefText(b);
                        return (
                            <Menu.Item
                                key={b.uid}
                                leftSection={<Icon size={16} />}
                                onClick={() => refText && insertAtCursor(`[[${refText}]]`)}
                            >
                                {b.title}
                            </Menu.Item>
                        );
                    })}
                </Menu.Dropdown>
            </Menu>
        </Stack>
    );
}