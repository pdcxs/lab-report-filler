import { create } from 'zustand';

interface UiState {
    /** 等待解压的 zip 路径。非 null 时全局弹窗会显示。 */
    pendingZip: string | null;
    /** 请求打开某个 zip：填入路径，弹窗出现。 */
    requestOpenZip: (zipPath: string) => void;
    /** 关闭弹窗，丢弃当前请求。 */
    cancelOpenZip: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    pendingZip: null,
    requestOpenZip: (zipPath) => set({ pendingZip: zipPath }),
    cancelOpenZip: () => set({ pendingZip: null }),
}));