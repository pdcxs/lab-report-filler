import { useEffect, useState } from 'react';
import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { useLabStore } from '../state/useLabStore';
import { strings } from '../i18n/strings';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { useOpenFolder } from '../hooks/useOpenFolder';
import { useUiStore } from '../state/useUiStore';

export function StudentWelcome() {
    const clearRole = useLabStore((s) => s.clearRole);
    const { pickAndOpen, busy: busyFolder } = useOpenFolder();
    const requestOpenZip = useUiStore((s) => s.requestOpenZip);

    const [dragOver, setDragOver] = useState(false);

    const handlePickZip = async () => {
        const zipPath = await open({
            multiple: false,
            filters: [{ name: 'Lab Package', extensions: ['zip'] }],
            title: '选择实验包（ZIP） / Select lab package',
        });
        if (typeof zipPath !== 'string') return;
        requestOpenZip(zipPath);
    };

    useEffect(() => {
        let unlisten: (() => void) | null = null;
        void (async () => {
            const webview = getCurrentWebview();
            unlisten = await webview.onDragDropEvent((event) => {
                const p = event.payload;
                if (p.type === 'over') setDragOver(true);
                else if (p.type === 'leave') setDragOver(false);
                else if (p.type === 'drop' && p.paths.length > 0) {
                    setDragOver(false);
                    const path = p.paths[0];
                    if (path.toLowerCase().endsWith('.zip')) {
                        requestOpenZip(path);
                    }
                }
            });
        })();
        return () => {
            if (unlisten) unlisten();
        };
    }, [requestOpenZip]);

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" p="md">
                <Button variant="subtle" size="xs" onClick={() => void clearRole()}>
                    {strings.zh.backToRole} / {strings.en.backToRole}
                </Button>
                <ColorSchemeToggle />
            </Group>

            <Box
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack align="center" gap="lg" maw={640} w="100%" px="lg">
                    <Title order={1}>Lab Report Filler</Title>
                    <Text c="dimmed" ta="center">
                        {strings.zh.dropZipHint} / {strings.en.dropZipHint}
                    </Text>

                    <Box
                        onClick={() => void handlePickZip()}
                        style={{
                            width: '100%',
                            border: `2px dashed var(--mantine-color-${dragOver ? 'blue' : 'gray'}-4)`,
                            background: dragOver ? 'var(--mantine-color-blue-0)' : 'transparent',
                            borderRadius: 12,
                            padding: 48,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            textAlign: 'center',
                        }}
                    >
                        <Stack align="center" gap="sm">
                            <Text style={{ fontSize: 32 }}>📦</Text>
                            <Button variant="light">
                                {strings.zh.openZip} / {strings.en.openZip}
                            </Button>
                        </Stack>
                    </Box>

                    <Button
                        variant="subtle"
                        size="sm"
                        loading={busyFolder}
                        onClick={() => void pickAndOpen()}
                    >
                        {strings.zh.openExistingFolder} / {strings.en.openExistingFolder}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}