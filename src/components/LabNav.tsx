import { NavLink, Stack, Title } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { pickLocalized, useT } from '../i18n/useT';

export function LabNav() {
    const config = useLabStore((s) => s.config);
    const lang = useLabStore((s) => s.lang);
    const activeId = useLabStore((s) => s.activeLabId);
    const setActive = useLabStore((s) => s.setActiveLab);
    const t = useT();

    if (!config) return null;

    return (
        <Stack gap="xs">
            <Title order={5}>{t('labs')}</Title>
            {config.experiments.map((exp, idx) => (
                <NavLink
                    key={exp.id}
                    active={exp.id === activeId}
                    onClick={() => setActive(exp.id)}
                    label={`${idx + 1}. ${pickLocalized(exp.name, lang)}`}
                />
            ))}
        </Stack>
    );
}