import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { useT } from '../i18n/useT';
import { useLabStore } from '../state/useLabStore';
import { newUid } from '../utils/uid';
import {
    IconCode,
    IconMathFunction,
    IconPhoto,
    IconPlus,
    IconTextSize,
} from '@tabler/icons-react';

export function AddBlockMenu({ labId }: { labId: string }) {
    const t = useT();
    const addBlock = useLabStore((s) => s.addBlock);
    const importImage = useLabStore((s) => s.importImage);
    const config = useLabStore((s) => s.config);

    const addText = () => addBlock(labId, { type: 'text', uid: newUid(), content: '' });

    const addCode = () =>
        addBlock(labId, {
            type: 'code',
            uid: newUid(),
            title: '',
            language: config?.codeLanguages?.[0] ?? 'java',
            code: '',
        });

    const addMath = () =>
        addBlock(labId, { type: 'math', uid: newUid(), title: '', formula: '' });

    const addImage = async () => {
        const selected = await openFile({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
        });
        if (typeof selected !== 'string') return;
        try {
            const imported = await importImage(selected);
            addBlock(labId, {
                type: 'image',
                uid: newUid(),
                title: '',
                relativePath: imported.relativePath,
                width: 80,
            });
        } catch (e) {
            notifications.show({ color: 'red', title: 'Error', message: String(e) });
        }
    };

    return (
        <Menu shadow="md" position="bottom-end">
            <Menu.Target>
                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />}>
                    {t('addBlock')}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item leftSection={<IconTextSize size={16} />} onClick={addText}>
                    {t('blockText')}
                </Menu.Item>
                <Menu.Item leftSection={<IconPhoto size={16} />} onClick={() => void addImage()}>
                    {t('blockImage')}
                </Menu.Item>
                <Menu.Item leftSection={<IconCode size={16} />} onClick={addCode}>
                    {t('blockCode')}
                </Menu.Item>
                <Menu.Item leftSection={<IconMathFunction size={16} />} onClick={addMath}>
                    {t('blockMath')}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}