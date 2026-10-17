import { Box, Group, Slider, Stack, Text, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';
import { checkTitle } from '../../utils/block-utils';
import { EMPTY_BLOCKS } from '../../utils/constants';

export function ImageBlock({ labId, block }: { labId: string; block: Extract<Block, { type: 'image' }> }) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);
    const blocks = useLabStore((s) => s.student.records[labId] ?? EMPTY_BLOCKS);

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
            <Box>
                <Text size="xs" c="dimmed">
                    {block.relativePath}
                </Text>
            </Box>
            <Group grow>
                <Box>
                    <Text size="xs" mb={4}>
                        {t('blockImageWidth')}: {block.width}%
                    </Text>
                    <Slider
                        value={block.width}
                        onChange={(v) =>
                            updateBlock(labId, block.uid, { width: v } as Partial<Block>)
                        }
                        min={10}
                        max={100}
                        step={5}
                    />
                </Box>
            </Group>
        </Stack>
    );
}