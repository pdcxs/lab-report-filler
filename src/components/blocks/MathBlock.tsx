import { Stack, Text, Textarea, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { checkTitle } from '../../utils/block-utils';
import { EMPTY_BLOCKS } from '../../utils/constants';

export function MathBlock({ labId, block }: { labId: string; block: Extract<Block, { type: 'math' }> }) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);

    const titleStatus = checkTitle(blocks, block.uid, block.title, false);
    const error = titleStatus.duplicate ? t('titleDuplicate') : null;

    return (
        <Stack gap="xs">
            <TextInput
                label={`${t('blockTitle')} (${t('cancel') /* 用 cancel 占位… */})`}
                placeholder={t('blockTitlePlaceholder')}
                value={block.title}
                error={error}
                onChange={(e) =>
                    updateBlock(labId, block.uid, { title: e.currentTarget.value } as Partial<Block>)
                }
            />
            <Textarea
                label={t('blockFormula')}
                autosize
                minRows={2}
                maxRows={10}
                value={block.formula}
                onChange={(e) =>
                    updateBlock(labId, block.uid, { formula: e.currentTarget.value } as Partial<Block>)
                }
                styles={{ input: { fontFamily: 'ui-monospace, monospace', fontSize: 13 } }}
            />
            <Text size="xs" c="dimmed">
                {t('blockFormulaHint')}
            </Text>
        </Stack>
    );
}