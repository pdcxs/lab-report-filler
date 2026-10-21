import type { ReactNode } from 'react';
import { modals } from '@mantine/modals';

export interface ConfirmDialogOptions {
    /** 对话框标题 */
    title?: ReactNode;
    /** 对话框正文，支持 React 节点以便中英双语排版 */
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 确认按钮颜色，例如 'red' 用于破坏性操作 */
    confirmColor?: string;
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
}: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        modals.openConfirmModal({
            title,
            children: message,
            centered: true,
            labels: { confirm: confirmLabel, cancel: cancelLabel },
            confirmProps: confirmColor ? { color: confirmColor } : undefined,
            onConfirm: () => resolve(true),
            // 所有关闭路径（确认、取消、遮罩、Esc、右上角关闭）都会触发 onClose，
            // 第二个 resolve 会被 Promise 忽略，因此无需区分关闭方式。
            onClose: () => resolve(false),
        });
    });
}
