import { Group, Paper, Text } from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

export function DatePickerRow({ labId }: { labId: string }) {
    const t = useT();
    const language = useLabStore((s) => s.config?.language ?? 'en');
    const date = useLabStore((s) => s.student.dates[labId] ?? null);
    const setDate = useLabStore((s) => s.setDate);

    const locale = language === 'zh' ? 'zh-cn' : 'en';

    return (
        <DatesProvider settings={{ locale }}>
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
        </DatesProvider>
    );
}