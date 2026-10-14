import { Badge, Box, Button, Group, Text } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { pickLocalized, useT } from '../i18n/useT';
import { LanguageToggle } from './LanguageToggle';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { StudentForm } from './StudentForm';
import { LabNav } from './LabNav';
import { LabView } from './LabView';
import { ExportBar } from './ExportBar';
import { useOpenFolder } from '../hooks/useOpenFolder';

export function Workspace() {
    const dir = useLabStore((s) => s.dir);
    const config = useLabStore((s) => s.config);
    const lang = useLabStore((s) => s.lang);
    const saving = useLabStore((s) => s.saving);
    const lastSaved = useLabStore((s) => s.lastSaved);
    const t = useT();
    const { pickAndOpen, busy } = useOpenFolder();

    const appTitle = config ? pickLocalized(config.ui.appTitle, lang) : 'Lab Report Filler';

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Box
                p="xs"
                px="md"
                style={{
                    borderBottom: '1px solid var(--mantine-color-gray-3)',
                    flexShrink: 0,
                }}
            >
                <Group justify="space-between">
                    <Group gap="sm">
                        <Text fw={600}>{appTitle}</Text>
                        {dir && (
                            <Text
                                size="xs"
                                c="dimmed"
                                title={dir}
                                style={{
                                    maxWidth: 480,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {dir}
                            </Text>
                        )}
                    </Group>
                    <Group gap="sm">
                        {saving ? (
                            <Badge variant="light">{t('saving')}</Badge>
                        ) : lastSaved ? (
                            <Badge color="green" variant="light">
                                {t('saved')}
                            </Badge>
                        ) : null}
                        <Button
                            variant="light"
                            size="xs"
                            loading={busy}
                            onClick={() => void pickAndOpen()}
                        >
                            {t('openFolder')}
                        </Button>
                        <ColorSchemeToggle />
                        <LanguageToggle />
                    </Group>
                </Group>
            </Box>

            <Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0 }} wrap="nowrap">
                <Box
                    w={300}
                    p="md"
                    style={{
                        borderRight: '1px solid var(--mantine-color-gray-3)',
                        overflowY: 'auto',
                        flexShrink: 0,
                    }}
                >
                    <StudentForm />
                    <LabNav />
                </Box>

                <Box
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                    }}
                >
                    <LabView />
                </Box>
            </Group>

            <ExportBar />
        </Box>
    );
}