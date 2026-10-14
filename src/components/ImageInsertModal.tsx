import { useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';
import { sanitizeLabel, slugifyLabel } from '../utils/label';

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
    return cleaned || 'fig';
}

export function ImageInsertModal({ opened, labId, onClose, onInsert }: Props) {
    const t = useT();
    const importImage = useLabStore((s) => s.importImage);
    const registerLabel = useLabStore((s) => s.registerLabel);
    const [srcPath, setSrcPath] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [caption, setCaption] = useState('');
    const [busy, setBusy] = useState(false);

    const handlePick = async () => {
        const selected = await openFile({
            multiple: false,
            filters: [
                {
                    name: 'Images',
                    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
                },
            ],
        });
        if (typeof selected === 'string') {
            setSrcPath(selected);
            const base = selected.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
            if (!label) setLabel(slugify(base));
            if (!caption) setCaption(base);
        }
    };

    const handleInsert = async () => {
        if (!srcPath) return;

        const sanitized = sanitizeLabel(label);
        const finalLabel = sanitized || slugifyLabel(caption || 'fig');

        if (!sanitized && label.trim()) {
            notifications.show({
                color: 'yellow',
                title: 'Label adjusted',
                message: `Label can only contain letters, digits, "-", "_", ":", "." and must start with a letter. Using "${finalLabel}" instead.`,
                autoClose: 5000,
            });
        }

        setBusy(true);
        try {
            const imported = await importImage(srcPath);
            const safeCaption = caption.replace(/"/g, '\\"');
            const snippet = `#figure(image("${imported.relativePath}", width: 80%), caption: "${safeCaption}") <${finalLabel}>`;
            onInsert(snippet);
            registerLabel(labId, { label: finalLabel, kind: 'figure', title: caption || finalLabel });
            setSrcPath(null);
            setLabel('');
            setCaption('');
        } catch (e) {
            notifications.show({ color: 'red', title: 'Import failed', message: String(e) });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('insertImage')}>
            <Stack gap="sm">
                <Group>
                    <Button variant="default" onClick={() => void handlePick()}>
                        {t('insertImage')}
                    </Button>
                    {srcPath && (
                        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                            {srcPath.replace(/^.*[\\/]/, '')}
                        </Text>
                    )}
                </Group>
                <TextInput
                    label={t('imageLabelPrompt')}
                    description='只允许英文字母、数字、-、_、:、.，且以字母开头 / Letters, digits, "-", "_", ":", "." only; must start with a letter'
                    value={label}
                    onChange={(e) => setLabel(e.currentTarget.value)}
                    placeholder="fig1"
                />
                <TextInput
                    label={t('imageCaptionPrompt')}
                    value={caption}
                    onChange={(e) => setCaption(e.currentTarget.value)}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button loading={busy} onClick={() => void handleInsert()} disabled={!srcPath}>
                        {t('confirm')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}