import { invoke } from '@tauri-apps/api/core';
import type { Block, CodeLanguage, ImportedImage } from '../types/lab-config';
import { newUid } from './uid';
import { DEFAULT_LANG_EXTS } from './constants';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

export interface FileInfo {
    path: string;
    name: string;
    stem: string;
    ext: string;
}

export function splitPath(path: string): FileInfo {
    const sep = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    const name = path.slice(sep + 1);
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
    return { path, name, stem, ext };
}

export function isImageExt(ext: string): boolean {
    return IMAGE_EXTS.includes(ext.toLowerCase());
}

/** 解析某个语言应匹配的后缀名。老师设置优先，否则用默认表。 */
export function resolveExtensions(lang: CodeLanguage): string[] {
    if (lang.extensions && lang.extensions.length > 0) {
        return lang.extensions.map((e) => e.toLowerCase());
    }
    return DEFAULT_LANG_EXTS[lang.name] ?? [];
}

export function extToLanguage(
    ext: string,
    languages: CodeLanguage[],
): string | null {
    const lower = ext.toLowerCase();
    for (const lang of languages) {
        if (resolveExtensions(lang).includes(lower)) return lang.name;
    }
    return null;
}

export interface DroppedFileResult {
    blocks: Block[];
    unsupported: string[];
}

export async function processDroppedFiles(
    paths: string[],
    codeLanguages: CodeLanguage[],
    importImage: (src: string) => Promise<ImportedImage>,
): Promise<DroppedFileResult> {
    const blocks: Block[] = [];
    const unsupported: string[] = [];

    for (const path of paths) {
        const info = splitPath(path);

        // 图片
        if (isImageExt(info.ext)) {
            try {
                const imported = await importImage(path);
                blocks.push({
                    type: 'image',
                    uid: newUid(),
                    title: info.stem,
                    relativePath: imported.relativePath,
                    width: 80,
                    collapsed: true,
                });
            } catch {
                unsupported.push(info.name);
            }
            continue;
        }

        // 代码：优先按扩展名匹配语言
        let matched = extToLanguage(info.ext, codeLanguages);
        // 匹配不到任何语言 → 用第一个语言作为兜底（"接收任何文件"）
        if (matched === null && codeLanguages.length > 0) {
            matched = codeLanguages[0].name;
        }

        if (matched !== null) {
            try {
                const content = await invoke<string>('read_text_file', { path });
                blocks.push({
                    type: 'code',
                    uid: newUid(),
                    title: info.name,
                    language: matched,
                    code: content,
                    collapsed: true,
                });
            } catch {
                unsupported.push(info.name);
            }
            continue;
        }

        unsupported.push(info.name);
    }

    return { blocks, unsupported };
}