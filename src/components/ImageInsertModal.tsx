import { useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { open as openFile } from '@tauri-apps/plugin-dialog';
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
        if (!label.trim()) {
            notifications.show({ color: 'red', title: 'Error', message: 'Label is required.' });
            return;
        }
        setBusy(true);
        try {
            const imported = await importImage(srcPath);
            const safeCaption = caption.replace(/"/g, '\\"');
            const snippet = `#figure(image("${imported.relativePath}", width: 80%), caption: "${safeCaption}") <${label}>`;
            onInsert(snippet);
            registerLabel(labId, { label, kind: 'figure', title: caption || label });
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