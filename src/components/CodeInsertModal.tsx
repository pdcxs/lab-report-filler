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
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

interface Props {
    opened: boolean;
    labId: string;
    onClose: () => void;
    onInsert: (snippet: string) => void;
}

function slugify(s: string): string {
    const cleaned = s
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return cleaned || 'code';
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
        const labelToUse = (label.trim() || slugify(caption || 'code')).replace(/[^A-Za-z0-9_\-:.]/g, '');
        const safeCaption = caption.replace(/"/g, '\\"');
        const trimmed = code.replace(/\s+$/, '');

        // #figure(caption: "...")[
        // ```java
        // code
        // ```
        // ] <label>
        const lines: string[] = [];
        lines.push('');
        lines.push(`#figure(caption: "${safeCaption}")[`);
        lines.push('```' + language);
        lines.push(trimmed);
        lines.push('```');
        lines.push(`] <${labelToUse}>`);
        lines.push('');

        onInsert(lines.join('\n'));
        registerLabel(labId, { label: labelToUse, kind: 'code', title: caption || labelToUse });

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
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
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