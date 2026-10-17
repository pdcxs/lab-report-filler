import { Stack, Text, Textarea, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';

export function MathBlock({
    labId,
    block,
}: {
    labId: string;
    block: Extract<Block, { type: 'math' }>;
}) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);

    return (
        <Stack gap="xs">
            <TextInput
                label={`${t('blockTitle')} (${t('optional')})`}
                placeholder={t('blockTitlePlaceholder')}
                value={block.title}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        title: e.currentTarget.value,
                    } as Partial<Block>)
                }
            />

            <Textarea
                label={t('blockFormula')}
                autosize
                minRows={2}
                maxRows={10}
                value={block.formula}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        formula: e.currentTarget.value,
                    } as Partial<Block>)
                }
                styles={{
                    input: {
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 13,
                    },
                }}
                placeholder="x_(1,2) = (-b plus.minus sqrt(b^2 - 4 a c)) / (2a)"
            />

            <Text size="xs" c="dimmed">
                {t('blockFormulaHint')}
            </Text>
        </Stack>
    );
}