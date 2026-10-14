import { useState } from 'react';
import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Textarea,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { sanitizeLabel, slugifyLabel } from '../utils/label';

interface Props {
    opened: boolean;
    labId: string;
    onClose: () => void;
    onInsert: (snippet: string) => void;
}

export function CodeInsertModal({ opened, labId, onClose, onInsert }: Props) {
    const t = useT();
    const config = useLabStore((s) => s.config);
    const registerLabel = useLabStore((s) => s.registerLabel);

    const languages = config?.codeLanguages ?? ['java', 'text'];

    const [language, setLanguage] = useState(languages[0] ?? 'java');
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [caption, setCaption] = useState('');

    const handleInsert = () => {
        if (!code.trim()) return;

        const sanitized = sanitizeLabel(label);
        const finalLabel = sanitized || slugifyLabel(caption || 'code');

        if (!sanitized && label.trim()) {
            notifications.show({
                color: 'yellow',
                title: 'Label adjusted',
                message: `Label can only contain letters, digits, and "-", and must start with a letter. Using "${finalLabel}" instead.`,
                autoClose: 5000,
            });
        }

        const safeCaption = caption.replace(/"/g, '\\"');
        const trimmed = code.replace(/\s+$/, '');

        const lines: string[] = [];
        lines.push('');
        lines.push(`#figure(caption: "${safeCaption}")[`);
        lines.push('```' + language);
        lines.push(trimmed);
        lines.push('```');
        lines.push(`] <${finalLabel}>`);
        lines.push('');

        onInsert(lines.join('\n'));
        registerLabel(labId, {
            label: finalLabel,
            kind: 'code',
            title: caption || finalLabel,
        });

        setCode('');
        setLabel('');
        setCaption('');
        setLanguage(languages[0] ?? 'java');
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('insertCode')} size="xl">
            <Stack gap="sm">
                <Select
                    label="Language"
                    data={languages.map((l) => ({ value: l, label: l }))}
                    value={language}
                    onChange={(v) => v && setLanguage(v)}
                    searchable
                />
                <TextInput
                    label="Caption"
                    placeholder="e.g. Main.java"
                    value={caption}
                    onChange={(e) => setCaption(e.currentTarget.value)}
                />
                <TextInput
                    label={t('imageLabelPrompt')}
                    description='只允许英文字母、数字和连字符 "-"，且以字母开头 / Letters, digits, and "-" only; must start with a letter'
                    placeholder="e.g. code1"
                    value={label}
                    onChange={(e) => setLabel(e.currentTarget.value)}
                />
                <Textarea
                    label="Code"
                    autosize
                    minRows={10}
                    maxRows={24}
                    value={code}
                    onChange={(e) => setCode(e.currentTarget.value)}
                    styles={{
                        input: {
                            fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                            fontSize: 13,
                            lineHeight: 1.5,
                        },
                    }}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleInsert} disabled={!code.trim()}>
                        {t('confirm')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}