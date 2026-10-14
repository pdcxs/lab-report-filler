import { Paper, Stack, TextInput, Title } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

export function StudentForm() {
    const student = useLabStore((s) => s.student);
    const config = useLabStore((s) => s.config);
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
                    label={nameCfg.label}
                    placeholder={nameCfg.placeholder}
                    description={nameCfg.hint}
                    value={student.name}
                    onChange={(e) => update({ name: e.currentTarget.value })}
                    maxLength={nameCfg.maxLength}
                />
                <TextInput
                    label={idCfg.label}
                    placeholder={idCfg.placeholder}
                    value={student.studentId}
                    onChange={(e) => update({ studentId: e.currentTarget.value })}
                />
                <TextInput
                    label={config.student.className.label}
                    placeholder={config.student.className.placeholder || config.course.className}
                    value={student.className}
                    onChange={(e) => update({ className: e.currentTarget.value })}
                />
                <TextInput
                    label={config.student.location.label}
                    placeholder={config.student.location.placeholder || config.course.location}
                    value={student.location}
                    onChange={(e) => update({ location: e.currentTarget.value })}
                />
            </Stack>
        </Paper>
    );
}