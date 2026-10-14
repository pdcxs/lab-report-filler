import {
    Alert,
    Box,
    Button,
    Group,
    ScrollArea,
    Text,
} from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

export function PreviewPane() {
    const pages = useLabStore((s) => s.previewPages);
    const error = useLabStore((s) => s.previewError);
    const refresh = useLabStore((s) => s.refreshPreview);
    const t = useT();

    return (
        <Box
            style={{
                width: '38%',
                minWidth: 280,
                maxWidth: 640,
                flexShrink: 0,
                borderRight: '1px solid var(--mantine-color-gray-3)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--mantine-color-gray-1)',
            }}
        >
            <Group
                justify="space-between"
                p="xs"
                px="md"
                style={{
                    borderBottom: '1px solid var(--mantine-color-gray-3)',
                    background: 'var(--mantine-color-body)',
                    flexShrink: 0,
                }}
            >
                <Text fw={600}>{t('preview')}</Text>
                <Button size="xs" variant="light" onClick={() => void refresh()}>
                    Refresh
                </Button>
            </Group>

            <ScrollArea style={{ flex: 1 }} p="md">
                {error && (
                    <Alert color="red" mb="md" title="Typst compile error">
                        <Text
                            size="xs"
                            style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                        >
                            {error}
                        </Text>
                    </Alert>
                )}
                {pages.length === 0 && !error && <Text c="dimmed">No preview yet.</Text>}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    {pages.map((svg, i) => (
                        <Box
                            key={i}
                            className="preview-page"
                            style={{
                                background: 'white',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                width: '100%',
                            }}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    ))}
                </div>
            </ScrollArea>
        </Box>
    );
}