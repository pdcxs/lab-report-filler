import { useCallback, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { useLabStore } from '../state/useLabStore';

export function useOpenFolder() {
    const openDir = useLabStore((s) => s.openDir);
    const [busy, setBusy] = useState(false);

    /** 直接打开一个已知路径（拖拽时用） */
    const openPath = useCallback(
        async (path: string) => {
            setBusy(true);
            try {
                await openDir(path);
            } catch (e) {
                notifications.show({
                    color: 'red',
                    title: 'Error',
                    message: String(e),
                    autoClose: 8000,
                });
            } finally {
                setBusy(false);
            }
        },
        [openDir],
    );

    /** 弹出目录选择器（点按钮时用） */
    const pickAndOpen = useCallback(async () => {
        const selected = await open({ directory: true, multiple: false });
        if (typeof selected !== 'string') return;
        await openPath(selected);
    }, [openPath]);

    return { pickAndOpen, openPath, busy };
}