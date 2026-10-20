import { Select, Stack, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';

const HEADING_LEVEL_KEYS = [
    'headingLevel1',
    'headingLevel2',
    'headingLevel3',
    'headingLevel4',
    'headingLevel5',
    'headingLevel6',
] as const;

export function HeadingBlock({
    labId,
    block,
}: {
    labId: string;
    block: Extract<Block, { type: 'heading' }>;
}) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);

    return (
        <Stack gap="xs">
            <Select
                label={t('headingLevel')}
                data={HEADING_LEVEL_KEYS.map((key, i) => ({
                    value: String(i + 1),
                    label: t(key),
                }))}
                value={String(block.level)}
                onChange={(v) =>
                    v &&
                    updateBlock(labId, block.uid, {
                        level: parseInt(v, 10),
                    } as Partial<Block>)
                }
            />
            <TextInput
                label={t('headingContent')}
                value={block.content}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        content: e.currentTarget.value,
                    } as Partial<Block>)
                }
            />
        </Stack>
    );
}