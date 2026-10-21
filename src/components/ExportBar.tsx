import { Box, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { reportDialog } from './modals';
import type { ValidationReport } from '../types/lab-config';

export function ExportBar() {
    const t = useT();
    const config = useLabStore((s) => s.config);
    const validating = useLabStore((s) => s.validating);
    const exporting = useLabStore((s) => s.exporting);
    const validate = useLabStore((s) => s.validate);
    const exportPdf = useLabStore((s) => s.exportPdf);

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
            const labName = lab ? lab.name : issue.labId;
            if (issue.kind === 'min_code_blocks')
                lines.push(t('labMinCodeBlocks', { lab: labName, n: issue.extra ?? 0 }));
            else if (issue.kind === 'min_figures')
                lines.push(t('labMinFigures', { lab: labName, n: issue.extra ?? 0 }));
            else if (issue.kind === 'min_text_blocks')
                lines.push(t('labMinTextBlocks', { lab: labName, n: issue.extra ?? 0 }));
            else if (issue.kind === 'prose')
                lines.push(t('labTooShort', { lab: labName, n: issue.extra ?? 0 }));
            else if (issue.kind === 'unreferenced')
                lines.push(`${labName}：${t('unreferencedWarning')} (${issue.label})`);
            else if (issue.kind === 'dangling_ref')
                lines.push(`${labName}：${t('danglingRefWarning')} (${issue.label})`);
            else if (issue.kind === 'ambiguous_ref')
                lines.push(`${labName}：${t('ambiguousRefWarning')} (${issue.label})`);
        }
        return lines;
    };

    const showValidationFailure = (report: ValidationReport) => {
        reportDialog({
            title: t('validationFailed'),
            lines: buildLines(report),
            confirmLabel: t('confirm'),
        });
    };

    const handleValidate = async () => {
        const report = await validate();
        if (!report) return;
        if (report.passed) {
            notifications.show({ color: 'green', title: 'OK', message: t('validationPassed') });
        } else {
            showValidationFailure(report);
        }
    };

    const handleExport = async () => {
        const report = await validate();
        if (!report) return;
        if (!report.passed) {
            showValidationFailure(report);
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
                reportDialog({
                    title: 'Export failed',
                    lines: [t('exportLocked')],
                    confirmLabel: t('confirm'),
                });
            } else {
                reportDialog({
                    title: 'Export failed',
                    lines: ['Typst could not compile the report.'],
                    detail: msg,
                    confirmLabel: t('confirm'),
                });
            }
        }
    };

    return (
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
                <Button variant="default" loading={validating} onClick={() => void handleValidate()}>
                    {t('validate')}
                </Button>
                <Button loading={exporting} onClick={() => void handleExport()}>
                    {t('export')}
                </Button>
            </Group>
        </Box>
    );
}
