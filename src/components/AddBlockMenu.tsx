import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import {
    IconCode,
    IconH1,
    IconMathFunction,
    IconPhoto,
    IconPlus,
    IconTextSize,
} from '@tabler/icons-react';
import type { Block } from '../types/lab-config';
import { useT } from '../i18n/useT';
import { useLabStore } from '../state/useLabStore';
import { newUid } from '../utils/uid';

export function AddBlockMenu({
    labId,
    position = 'end',
}: {
    labId: string;
    position?: 'start' | 'end';
}) {
    const t = useT();
    const addBlock = useLabStore((s) => s.addBlock);
    const prependBlock = useLabStore((s) => s.prependBlock);
    const importImage = useLabStore((s) => s.importImage);
    const config = useLabStore((s) => s.config);

    const insert = (block: Block) => {
        if (position === 'start') prependBlock(labId, block);
        else addBlock(labId, block);
    };

    const addText = () =>
        insert({ type: 'text', uid: newUid(), content: '', raw: false });

    const addHeading = () =>
        insert({ type: 'heading', uid: newUid(), level: 1, content: '' });

    const addCode = () =>
        insert({
            type: 'code',
            uid: newUid(),
            title: '',
            language: config?.codeLanguages?.[0] ?? 'java',
            code: '',
        });

    const addMath = () =>
        insert({
            type: 'math',
            uid: newUid(),
            title: '',
            formula: '',
            format: 'typst',
        });

    const addImage = async () => {
        const selected = await openFile({
            multiple: false,
            filters: [
                {
                    name: 'Images',
                    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
                },
            ],
        });
        if (typeof selected !== 'string') return;
        try {
            const imported = await importImage(selected);
            insert({
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
        <Menu shadow="md" position="bottom-end" withinPortal>
            <Menu.Target>
                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />}>
                    {t('addBlock')}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item leftSection={<IconTextSize size={16} />} onClick={addText}>
                    {t('blockText')}
                </Menu.Item>
                <Menu.Item leftSection={<IconH1 size={16} />} onClick={addHeading}>
                    {t('blockHeading')}
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconPhoto size={16} />}
                    onClick={() => void addImage()}
                >
                    {t('blockImage')}
                </Menu.Item>
                <Menu.Item leftSection={<IconCode size={16} />} onClick={addCode}>
                    {t('blockCode')}
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconMathFunction size={16} />}
                    onClick={addMath}
                >
                    {t('blockMath')}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}