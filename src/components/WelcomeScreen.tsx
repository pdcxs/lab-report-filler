import { useEffect, useState } from 'react';
import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useT } from '../i18n/useT';
import { LanguageToggle } from './LanguageToggle';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { useOpenFolder } from '../hooks/useOpenFolder';

export function WelcomeScreen() {
    const t = useT();
    const { pickAndOpen, openPath, busy } = useOpenFolder();
    const [dragOver, setDragOver] = useState(false);

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
                    void openPath(p.paths[0]);
                }
            });
        })();
        return () => {
            if (unlisten) unlisten();
        };
    }, [openPath]);

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group justify="flex-end" p="md" gap="sm">
                <ColorSchemeToggle />
                <LanguageToggle />
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
                        {t('dropHint')}
                    </Text>

                    <Box
                        onClick={() => void pickAndOpen()}
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
                            <Text style={{ fontSize: 32 }}>📁</Text>
                            <Button variant="light" loading={busy}>
                                {t('openFolder')}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}