import { SegmentedControl, Stack, Text, Textarea, TextInput } from '@mantine/core';
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

            <Stack gap={4}>
                <Text size="sm" fw={500}>
                    {t('formulaFormat')}
                </Text>
                <SegmentedControl
                    value={block.format}
                    onChange={(v) =>
                        updateBlock(labId, block.uid, {
                            format: v as 'typst' | 'latex',
                        } as Partial<Block>)
                    }
                    data={[
                        { value: 'typst', label: 'Typst' },
                        { value: 'latex', label: 'LaTeX' },
                    ]}
                />
            </Stack>

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
                placeholder={
                    block.format === 'latex'
                        ? '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
                        : 'x_(1,2) = (-b plus.minus sqrt(b^2 - 4a c)) / (2a)'
                }
            />

            <Text size="xs" c="dimmed">
                {block.format === 'latex' ? t('blockFormulaHintLatex') : t('blockFormulaHint')}
            </Text>
        </Stack>
    );
}