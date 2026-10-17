import { Select, Stack, Textarea, TextInput } from '@mantine/core';
import { EMPTY_BLOCKS, DEFAULT_CODE_LANGUAGES } from '../../utils/constants';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { checkTitle } from '../../utils/block-utils';

export function CodeBlock({ labId, block }: { labId: string; block: Extract<Block, { type: 'code' }> }) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);

    const languages = useLabStore((s) => s.config?.codeLanguages ?? DEFAULT_CODE_LANGUAGES);
    const titleStatus = checkTitle(blocks, block.uid, block.title, true);
    const error = titleStatus.empty ? t('titleEmpty') : titleStatus.duplicate ? t('titleDuplicate') : null;

    return (
        <Stack gap="xs">
            <TextInput
                label={t('blockTitle')}
                placeholder={t('blockTitlePlaceholder')}
                value={block.title}
                error={error}
                onChange={(e) =>
                    updateBlock(labId, block.uid, { title: e.currentTarget.value } as Partial<Block>)
                }
            />
            <Select
                label={t('blockCodeLanguage')}
                data={languages.map((l) => ({ value: l, label: l }))}
                value={block.language}
                onChange={(v) => v && updateBlock(labId, block.uid, { language: v } as Partial<Block>)}
                searchable
            />
            <Textarea
                label={t('blockCode')}
                autosize
                minRows={4}
                maxRows={30}
                value={block.code}
                onChange={(e) =>
                    updateBlock(labId, block.uid, { code: e.currentTarget.value } as Partial<Block>)
                }
                styles={{
                    input: {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 1.5,
                    },
                }}
            />
        </Stack>
    );
}