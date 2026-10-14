import { useState } from 'react';
import {
    Box,
    Button,
    Group,
    List,
    Modal,
    Stack,
    Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import type { ValidationReport } from '../types/lab-config';

interface ErrorModalState {
    title: string;
    lines: string[];
    detail?: string;
}

export function ExportBar() {
    const t = useT();
    const lang = useLabStore((s) => s.lang);
    const config = useLabStore((s) => s.config);
    const validating = useLabStore((s) => s.validating);
    const exporting = useLabStore((s) => s.exporting);
    const validate = useLabStore((s) => s.validate);
    const exportPdf = useLabStore((s) => s.exportPdf);

    const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);

    const buildLines = (report: ValidationReport): string[] => {
        const lines: string[] = [];
        for (const e of report.globalErrors) {
            if (e === 'missing_name') lines.push(t('missingName'));
            else if (e === 'missing_id') lines.push(t('missingId'));
            else if (e === 'invalid_name') lines.push(t('invalidName'));
            else if (e === 'invalid_id') lines.push(t('invalidId'));
        }
        for (const issue of report.issues) {
            const lab = config?.experiments.find((x) => x.id === issue.labId);
            const labName = lab
                ? lang === 'zh'
                    ? lab.name.zh
                    : lab.name.en
                : issue.labId;
            if (issue.kind === 'code_block')
                lines.push(t('labMissingCode', { lab: labName }));
            else if (issue.kind === 'figure')
                lines.push(t('labMissingFigure', { lab: labName }));
            else if (issue.kind === 'figure_reference')
                lines.push(t('labMissingRef', { lab: labName }));
            else if (issue.kind === 'prose')
                lines.push(t('labTooShort', { lab: labName, n: issue.extra ?? 0 }));
        }
        return lines;
    };

    const handleValidate = async () => {
        const report = await validate();
        if (!report) return;
        if (report.passed) {
            notifications.show({
                color: 'green',
                title: 'OK',
                message: t('validationPassed'),
            });
        } else {
            setErrorModal({
                title: t('validationFailed'),
                lines: buildLines(report),
            });
        }
    };

    const handleExport = async () => {
        const report = await validate();
        if (!report) return;
        if (!report.passed) {
            setErrorModal({
                title: t('validationFailed'),
                lines: buildLines(report),
            });
            return;
        }

        try {
            const result = await exportPdf();
            if (result) {
                notifications.show({
                    color: 'green',
                    title: 'Exported',
                    message: t('exportSuccess', { file: result.fileName }),
                });
            }
        } catch (e) {
            const msg = String(e);
            if (msg.includes('PDF_LOCKED')) {
                setErrorModal({
                    title: 'Export failed',
                    lines: [t('exportLocked')],
                });
            } else {
                setErrorModal({
                    title: 'Export failed',
                    lines: ['Typst could not compile the report.'],
                    detail: msg,
                });
            }
        }
    };

    return (
        <>
            <Box
                p="xs"
                px="md"
                style={{
                    borderTop: '1px solid var(--mantine-color-gray-3)',
                    flexShrink: 0,
                    background: 'var(--mantine-color-body)',
                }}
            >
                <Group justify="flex-end">
                    <Button
                        variant="default"
                        loading={validating}
                        onClick={() => void handleValidate()}
                    >
                        {t('validate')}
                    </Button>
                    <Button loading={exporting} onClick={() => void handleExport()}>
                        {t('export')}
                    </Button>
                </Group>
            </Box>

            <Modal
                opened={errorModal !== null}
                onClose={() => setErrorModal(null)}
                title={errorModal?.title ?? ''}
                size={errorModal?.detail ? 'xl' : 'lg'}
                centered
            >
                <Stack gap="sm">
                    {errorModal && errorModal.lines.length > 0 && (
                        <List spacing="xs">
                            {errorModal.lines.map((line, i) => (
                                <List.Item key={i}>
                                    <Text style={{ whiteSpace: 'pre-wrap' }}>{line}</Text>
                                </List.Item>
                            ))}
                        </List>
                    )}

                    {errorModal?.detail && (
                        <Box
                            style={{
                                maxHeight: 400,
                                overflow: 'auto',
                                background: 'var(--mantine-color-gray-1)',
                                borderRadius: 6,
                                padding: 12,
                            }}
                        >
                            <Text
                                size="xs"
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'ui-monospace, monospace',
                                }}
                            >
                                {errorModal.detail}
                            </Text>
                        </Box>
                    )}

                    <Group justify="flex-end">
                        <Button onClick={() => setErrorModal(null)}>
                            {t('confirm')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}