import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ColorSchemeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
    const next = computed === 'dark' ? 'light' : 'dark';

    return (
        <Tooltip label={next === 'dark' ? 'Dark mode' : 'Light mode'}>
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setColorScheme(next)}
                aria-label="Toggle color scheme"
            >
                {computed === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>
        </Tooltip>
    );
}