import { useCallback, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { invoke } from '@tauri-apps/api/core';
import { useLabStore } from '../state/useLabStore';

interface ExtractResult {
    dir: string;
    fileCount: number;
}

export function useOpenZip() {
    const openDir = useLabStore((s) => s.openDir);
    const [busy, setBusy] = useState(false);

    const extractInto = useCallback(
        async (zipPath: string, targetDir: string) => {
            setBusy(true);
            try {
                await invoke<ExtractResult>('extract_zip', { zipPath, targetDir });
                await openDir(targetDir);
            } catch (e) {
                const msg = String(e);
                if (msg.includes('DIR_NOT_EMPTY')) {
                    notifications.show({
                        color: 'red',
                        title: 'Error',
                        message:
                            'The selected folder is not empty. Please choose an empty folder.\n' +
                            '所选文件夹不为空，请选择一个空文件夹。',
                        autoClose: 8000,
                    });
                } else {
                    notifications.show({
                        color: 'red',
                        title: 'Error',
                        message: msg,
                        autoClose: 8000,
                    });
                }
            } finally {
                setBusy(false);
            }
        },
        [openDir],
    );

    return { extractInto, busy };
}