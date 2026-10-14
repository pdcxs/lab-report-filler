import { Box, ScrollArea, Stack } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { LabReadOnlyPanel } from './LabReadOnlyPanel';
import { RecordEditor } from './RecordEditor';
import { PreviewPane } from './PreviewPane';

export function LabView() {
    const config = useLabStore((s) => s.config);
    const activeId = useLabStore((s) => s.activeLabId);

    if (!config) return null;
    const exp =
        config.experiments.find((e) => e.id === activeId) ?? config.experiments[0];
    if (!exp) return null;

    return (
        <Box
            style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'row',
            }}
        >
            <ScrollArea style={{ flex: 1, minWidth: 0 }}>
                <Stack p="md" gap="md">
                    <LabReadOnlyPanel experiment={exp} />
                    <RecordEditor experiment={exp} key={exp.id} />
                </Stack>
            </ScrollArea>
            <PreviewPane />
        </Box>
    );
}