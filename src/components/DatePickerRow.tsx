import { Group, Paper, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

export function DatePickerRow({ labId }: { labId: string }) {
    const t = useT();
    const date = useLabStore((s) => s.student.dates[labId] ?? null);
    const setDate = useLabStore((s) => s.setDate);

    return (
        <Paper withBorder p="md">
            <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={600}>
                    {t('dateLabel')}
                </Text>
                <DatePickerInput
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder={t('dateDefault')}
                    value={date ? dayjs(date).toDate() : null}
                    onChange={(d) => setDate(labId, d ? dayjs(d).format('YYYY-MM-DD') : null)}
                    w={220}
                />
            </Group>
        </Paper>
    );
}