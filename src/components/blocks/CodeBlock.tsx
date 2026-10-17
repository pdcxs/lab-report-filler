import { Select, Stack, Textarea, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { DEFAULT_CODE_LANGUAGES } from '../../utils/constants';

export function CodeBlock({
    labId,
    block,
}: {
    labId: string;
    block: Extract<Block, { type: 'code' }>;
}) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);
    const languages = useLabStore(
        (s) => s.config?.codeLanguages ?? DEFAULT_CODE_LANGUAGES,
    );

    const error = !block.title.trim() ? t('titleEmpty') : undefined;

    return (
        <Stack gap="xs">
            <TextInput
                label={t('blockTitle')}
                placeholder={t('blockTitlePlaceholder')}
                value={block.title}
                error={error}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        title: e.currentTarget.value,
                    } as Partial<Block>)
                }
            />

            <Select
                label={t('blockCodeLanguage')}
                data={languages.map((l) => ({ value: l, label: l }))}
                value={block.language}
                onChange={(v) =>
                    v && updateBlock(labId, block.uid, { language: v } as Partial<Block>)
                }
                searchable
                allowDeselect={false}
            />

            <Textarea
                label={t('blockCode')}
                autosize
                minRows={4}
                maxRows={30}
                value={block.code}
                onChange={(e) =>
                    updateBlock(labId, block.uid, {
                        code: e.currentTarget.value,
                    } as Partial<Block>)
                }
                styles={{
                    input: {
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 1.5,
                    },
                }}
            />
        </Stack>
    );
}