import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { strings } from '../i18n/strings';
import { ColorSchemeToggle } from './ColorSchemeToggle';

export function TeacherWelcome() {
    const clearRole = useLabStore((s) => s.clearRole);

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
                    <Title order={1}>Teacher Mode</Title>
                    <Text c="dimmed" ta="center">
                        教师模式正在开发中 / Teacher mode coming soon
                    </Text>
                </Stack>
            </Box>
        </Box>
    );
}