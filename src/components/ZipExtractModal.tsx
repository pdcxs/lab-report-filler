import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useLabStore } from '../state/useLabStore';
import { useUiStore } from '../state/useUiStore';

export function ZipExtractModal() {
    const pendingZip = useUiStore((s) => s.pendingZip);
    const cancelOpenZip = useUiStore((s) => s.cancelOpenZip);
    const openDir = useLabStore((s) => s.openDir);

    const handlePickFolder = async () => {
        if (!pendingZip) return;

        while (true) {
            const targetDir = await open({
                directory: true,
                multiple: false,
                title: '选择一个空文件夹 / Choose an empty folder',
            });
            if (typeof targetDir !== 'string') {
                cancelOpenZip();
                return;
            }
            try {
                await invoke('extract_zip', { zipPath: pendingZip, targetDir });
                await openDir(targetDir);
                cancelOpenZip();
                return;
            } catch (e) {
                if (String(e).includes('DIR_NOT_EMPTY')) {
                    const retry = window.confirm(
                        '所选文件夹不为空，是否重新选择？\n' +
                        'The folder is not empty. Choose another one?',
                    );
                    if (!retry) {
                        cancelOpenZip();
                        return;
                    }
                    continue;
                }
                notifications.show({
                    color: 'red',
                    title: 'Error',
                    message: String(e),
                    autoClose: 8000,
                });
                cancelOpenZip();
                return;
            }
        }
    };

    return (
        <Modal
            opened={pendingZip !== null}
            onClose={cancelOpenZip}
            title="选择解压位置 / Choose extraction folder"
            centered
        >
            <Stack gap="md">
                <Text>
                    接下来请选择一个<strong>空文件夹</strong>，
                    实验包会被解压到那里，然后自动打开。
                </Text>
                <Text size="sm" c="dimmed">
                    Next, choose an <strong>empty folder</strong>. The lab package will
                    be extracted there and opened automatically.
                </Text>
                {pendingZip && (
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                        ZIP: {pendingZip}
                    </Text>
                )}
                <Group justify="flex-end">
                    <Button variant="default" onClick={cancelOpenZip}>
                        取消 / Cancel
                    </Button>
                    <Button onClick={() => void handlePickFolder()}>
                        选择文件夹 / Choose folder
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}