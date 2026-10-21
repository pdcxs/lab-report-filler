import type { ReactNode } from 'react';
import {
    Box,
    Button,
    Code,
    Group,
    List,
    Modal,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { randomId } from '@mantine/hooks';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useLabStore } from '../state/useLabStore';
import { useUiStore } from '../state/useUiStore';

/* ------------------------------------------------------------------ *
 * 通用对话框：确认 / 消息
 * ------------------------------------------------------------------ */

export interface ConfirmDialogOptions {
    /** 对话框标题 */
    title?: ReactNode;
    /** 对话框正文，支持 React 节点以便中英双语排版 */
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 确认按钮颜色，例如 'red' 用于破坏性操作 */
    confirmColor?: string;
    /** 点击遮罩是否关闭，默认 false，避免误触取消 */
    closeOnClickOutside?: boolean;
}

/**
 * Mantine Modal 版的 window.confirm。
 *
 * 确认返回 true；取消、点击遮罩、按 Esc 或关闭按钮返回 false。
 * 使用前提：应用已由 <ModalsProvider> 包裹（见 src/main.tsx）。
 */
export function confirmDialog({
    title,
    message,
    confirmLabel = '确定 / Confirm',
    cancelLabel = '取消 / Cancel',
    confirmColor,
    closeOnClickOutside = false,
}: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        modals.openConfirmModal({
            title,
            children: message,
            centered: true,
            closeOnClickOutside,
            labels: { confirm: confirmLabel, cancel: cancelLabel },
            confirmProps: confirmColor ? { color: confirmColor } : undefined,
            onConfirm: () => resolve(true),
            // 所有关闭路径（确认、取消、Esc、右上角关闭）都会触发 onClose，
            // 第二个 resolve 会被 Promise 忽略，因此无需区分关闭方式。
            onClose: () => resolve(false),
        });
    });
}

export interface ReportDialogOptions {
    /** 对话框标题 */
    title: ReactNode;
    /** 逐条展示的信息 */
    lines?: ReactNode[];
    /** 需要等宽滚动展示的详细信息（例如编译输出） */
    detail?: string;
    confirmLabel?: string;
}

/**
 * 信息 / 错误报告对话框，替代各组件内自行维护的只读 Modal。
 * 例如校验失败、导出失败时使用。
 */
export function reportDialog({
    title,
    lines = [],
    detail,
    confirmLabel = '确定 / Confirm',
}: ReportDialogOptions): void {
    const modalId = randomId();
    modals.open({
        modalId,
        title,
        centered: true,
        size: detail ? 'xl' : 'lg',
        children: (
            <Stack gap="sm">
                {lines.length > 0 && (
                    <List spacing="xs">
                        {lines.map((line, i) => (
                            <List.Item key={i}>
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{line}</Text>
                            </List.Item>
                        ))}
                    </List>
                )}
                {detail && (
                    <Box
                        style={{
                            maxHeight: 400,
                            overflow: 'auto',
                            background: 'var(--mantine-color-gray-1)',
                            borderRadius: 6,
                            padding: 12,
                        }}
                    >
                        <Text
                            size="xs"
                            style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'ui-monospace, monospace',
                            }}
                        >
                            {detail}
                        </Text>
                    </Box>
                )}
                <Group justify="flex-end">
                    <Button onClick={() => modals.close(modalId)}>{confirmLabel}</Button>
                </Group>
            </Stack>
        ),
    });
}

/* ------------------------------------------------------------------ *
 * 全局弹窗：由 store 状态驱动，应用层面常驻
 * ------------------------------------------------------------------ */

function ZipExtractModal() {
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
                    const retry = await confirmDialog({
                        title: '文件夹不为空 / Folder not empty',
                        message: (
                            <Stack gap="xs">
                                <Text size="sm">所选文件夹不为空，是否重新选择？</Text>
                                <Text size="sm" c="dimmed">
                                    The folder is not empty. Choose another one?
                                </Text>
                            </Stack>
                        ),
                        confirmLabel: '重新选择 / Choose again',
                        cancelLabel: '取消 / Cancel',
                    });
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

function TypstMissingModal() {
    const typstAvailable = useLabStore((s) => s.typstAvailable);
    const typstMessage = useLabStore((s) => s.typstMessage);
    const checkTypst = useLabStore((s) => s.checkTypst);

    const opened = typstAvailable === false;

    return (
        <Modal
            opened={opened}
            onClose={() => {
                /* 不允许关闭 */
            }}
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            size="lg"
            centered
            title={<Title order={4}>Typst is not installed / 未检测到 Typst</Title>}
        >
            <Stack gap="md">
                <Text>
                    This app uses <b>Typst</b> to compile your report into a PDF.
                    Typst was not found on your system. Please install it and then
                    click <b>Retry</b>.
                </Text>
                <Text size="sm" c="dimmed">
                    本程序使用 <b>Typst</b> 编译生成 PDF。系统中未检测到 Typst，
                    请先安装，然后点击 <b>重试</b>。
                </Text>

                <Box>
                    <Text fw={600} mb="xs">
                        Installation / 安装方法
                    </Text>
                    <List spacing="xs" size="sm">
                        <List.Item>
                            <b>Arch Linux</b>：
                            <Code block>sudo pacman -S typst</Code>
                        </List.Item>
                        <List.Item>
                            <b>Ubuntu / Debian</b>：
                            <Code block>sudo apt install typst</Code>
                            <Text size="xs" c="dimmed" mt={4}>
                                If not available in your sources: <Code>cargo install typst-cli</Code>
                            </Text>
                        </List.Item>
                        <List.Item>
                            <b>Fedora</b>：
                            <Code block>sudo dnf install typst</Code>
                        </List.Item>
                        <List.Item>
                            <b>Any system with Rust</b>：
                            <Code block>cargo install typst-cli</Code>
                        </List.Item>
                    </List>

                    <Text size="xs" c="dimmed" mt="sm">
                        After installation, make sure <Code>typst --version</Code> works
                        in a terminal.
                    </Text>
                </Box>

                {typstMessage && (
                    <Box
                        style={{
                            background: 'var(--mantine-color-gray-1)',
                            borderRadius: 6,
                            padding: 12,
                        }}
                    >
                        <Text size="xs" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {typstMessage}
                        </Text>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button onClick={() => void checkTypst()}>Retry / 重试</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

/**
 * 应用级常驻弹窗集合，在 App 中渲染一次即可。
 */
export function AppModals() {
    return (
        <>
            <ZipExtractModal />
            <TypstMissingModal />
        </>
    );
}
