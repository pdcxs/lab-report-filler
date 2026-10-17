import { Box, Group, Slider, Stack, Text, TextInput } from '@mantine/core';
import type { Block } from '../../types/lab-config';
import { useT } from '../../i18n/useT';
import { useLabStore } from '../../state/useLabStore';

export function ImageBlock({
    labId,
    block,
}: {
    labId: string;
    block: Extract<Block, { type: 'image' }>;
}) {
    const t = useT();
    const updateBlock = useLabStore((s) => s.updateBlock);

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

            <Box>
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                    {block.relativePath}
                </Text>
            </Box>

            <Box>
                <Group justify="space-between" mb={4}>
                    <Text size="xs">{t('blockImageWidth')}</Text>
                    <Text size="xs" c="dimmed">
                        {block.width}%
                    </Text>
                </Group>
                <Slider
                    value={block.width}
                    onChange={(v) =>
                        updateBlock(labId, block.uid, { width: v } as Partial<Block>)
                    }
                    min={10}
                    max={100}
                    step={5}
                    marks={[
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 75, label: '75' },
                        { value: 100, label: '100' },
                    ]}
                />
            </Box>
        </Stack>
    );
}