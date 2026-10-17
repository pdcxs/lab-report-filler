import { Button, Menu, Stack, Textarea } from '@mantine/core';
import { useRef } from 'react';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { EMPTY_BLOCKS } from '../../utils/constants';

type TitledBlock = Extract<Block, { type: 'image' | 'code' | 'math' }>;

function hasTitle(b: Block): b is TitledBlock {
    return b.type !== 'text' && b.title.trim() !== '';
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

    // 当前实验里所有可引用的项（按 blocks 顺序）
    const referenceables = blocks.filter(hasTitle);

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
                        const icon =
                            b.type === 'image' ? '🖼' : b.type === 'code' ? '💻' : '∑';
                        return (
                            <Menu.Item
                                key={b.uid}
                                onClick={() => insertAtCursor(`[[${b.title}]]`)}
                            >
                                {icon} {b.title}
                            </Menu.Item>
                        );
                    })}
                </Menu.Dropdown>
            </Menu>
        </Stack>
    );
}