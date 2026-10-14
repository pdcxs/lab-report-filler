import { Paper, Stack, TextInput, Title } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { pickLocalized, useT } from '../i18n/useT';

export function StudentForm() {
    const student = useLabStore((s) => s.student);
    const config = useLabStore((s) => s.config);
    const lang = useLabStore((s) => s.lang);
    const update = useLabStore((s) => s.updateStudent);
    const t = useT();

    if (!config) return null;
    const nameCfg = config.student.name;
    const idCfg = config.student.studentId;

    return (
        <Paper withBorder p="md" mb="md">
            <Title order={5} mb="sm">
                {t('studentInfo')}
            </Title>
            <Stack gap="sm">
                <TextInput
                    label={pickLocalized(nameCfg.label, lang)}
                    placeholder={pickLocalized(nameCfg.placeholder, lang)}
                    description={pickLocalized(nameCfg.hint, lang)}
                    value={student.name}
                    onChange={(e) => update({ name: e.currentTarget.value })}
                    maxLength={nameCfg.maxLength}
                />
                <TextInput
                    label={pickLocalized(idCfg.label, lang)}
                    placeholder={pickLocalized(idCfg.placeholder, lang)}
                    value={student.studentId}
                    onChange={(e) => update({ studentId: e.currentTarget.value })}
                />
            </Stack>
        </Paper>
    );
}