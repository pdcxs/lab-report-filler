import {
    Box,
    Button,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { strings } from '../i18n/strings';
import { ColorSchemeToggle } from './ColorSchemeToggle';

export function RoleSelection() {
    const setRole = useLabStore((s) => s.setRole);

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group justify="flex-end" p="md">
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
                <Stack align="center" gap="xl" maw={720} w="100%" px="lg">
                    <Title order={1}>Lab Report Filler</Title>
                    <Text c="dimmed">
                        {strings.zh.selectRole} / {strings.en.selectRole}
                    </Text>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" w="100%">
                        <RoleCard
                            icon="🎓"
                            zh={strings.zh.iAmStudent}
                            en={strings.en.iAmStudent}
                            onClick={() => void setRole('student')}
                        />
                        <RoleCard
                            icon="👩‍🏫"
                            zh={strings.zh.iAmTeacher}
                            en={strings.en.iAmTeacher}
                            onClick={() => void setRole('teacher')}
                        />
                    </SimpleGrid>
                </Stack>
            </Box>
        </Box>
    );
}

function RoleCard(props: {
    icon: string;
    zh: string;
    en: string;
    onClick: () => void;
}) {
    return (
        <Button
            variant="light"
            size="xl"
            h={170}
            onClick={props.onClick}
            styles={{ label: { whiteSpace: 'normal', width: '100%' } }}
        >
            <Stack align="center" gap="xs">
                <Text style={{ fontSize: 40 }}>{props.icon}</Text>
                <Text fw={600}>{props.zh}</Text>
                <Text size="xs" c="dimmed">
                    {props.en}
                </Text>
            </Stack>
        </Button>
    );
}