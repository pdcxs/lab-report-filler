import { useRef, useState } from 'react';
import { Button, Group, Paper, Text, Textarea } from '@mantine/core';
import type { Experiment } from '../types/lab-config';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { ExampleModal } from './ExampleModal';
import { ImageInsertModal } from './ImageInsertModal';
import { ReferencePicker } from './ReferencePicker';
import { CodeInsertModal } from './CodeInsertModal';

export function RecordEditor({ experiment }: { experiment: Experiment }) {
    const t = useT();
    const student = useLabStore((s) => s.student);
    const updateRecord = useLabStore((s) => s.updateRecord);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [exampleOpen, setExampleOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [refOpen, setRefOpen] = useState(false);
    const [codeOpen, setCodeOpen] = useState(false);

    const value = student.records[experiment.id] ?? '';

    const insertAtCursor = (text: string) => {
        const el = textareaRef.current;
        if (!el) {
            updateRecord(experiment.id, value + text);
            return;
        }
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + text + value.slice(end);
        updateRecord(experiment.id, next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + text.length;
            el.setSelectionRange(pos, pos);
        });
    };

    return (
        <Paper withBorder p="md">
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <Text fw={600}>{t('record')}</Text>
                <Group gap="xs" wrap="nowrap">
                    <Button variant="light" size="xs" onClick={() => setCodeOpen(true)}>
                        {t('insertCode')}
                    </Button>
                    <Button variant="light" size="xs" onClick={() => setImageOpen(true)}>
                        {t('insertImage')}
                    </Button>
                    <Button variant="light" size="xs" onClick={() => setRefOpen(true)}>
                        {t('insertReference')}
                    </Button>
                    {experiment.example && (
                        <Button variant="subtle" size="xs" onClick={() => setExampleOpen(true)}>
                            {t('showExample')}
                        </Button>
                    )}
                </Group>
            </Group>

            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => updateRecord(experiment.id, e.currentTarget.value)}
                placeholder={experiment.placeholder}
                autosize
                minRows={12}
                maxRows={30}
                styles={{
                    input: {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 1.5,
                    },
                }}
            />

            <ExampleModal
                opened={exampleOpen}
                onClose={() => setExampleOpen(false)}
                example={experiment.example}
                onCopy={() => {
                    insertAtCursor(experiment.example);
                    setExampleOpen(false);
                }}
            />

            <ImageInsertModal
                opened={imageOpen}
                labId={experiment.id}
                onClose={() => setImageOpen(false)}
                onInsert={(snippet) => {
                    insertAtCursor('\n' + snippet + '\n');
                    setImageOpen(false);
                }}
            />

            <ReferencePicker
                opened={refOpen}
                labId={experiment.id}
                content={value}
                onClose={() => setRefOpen(false)}
                onPick={(ref) => {
                    insertAtCursor(ref);
                    setRefOpen(false);
                }}
            />

            <CodeInsertModal
                opened={codeOpen}
                labId={experiment.id}
                onClose={() => setCodeOpen(false)}
                onInsert={(snippet) => {
                    insertAtCursor(snippet);
                    setCodeOpen(false);
                }}
            />
        </Paper>
    );
}