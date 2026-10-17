import type { Block } from '../types/lab-config';

/** 与 Rust 侧 `Block::label()` 完全一致：同一标题 → 同一 label */
function fnv1a(s: string): number {
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
    }
    return hash;
}

function hash8(title: string): string {
    return fnv1a(title).toString(16).padStart(8, '0');
}

export function labelFor(block: Block): string | null {
    if (block.type === 'text') return null;
    if (block.type === 'image') return `fig-${hash8(block.title)}`;
    if (block.type === 'code') return `code-${hash8(block.title)}`;
    if (block.type === 'math') {
        if (!block.title.trim()) return null;
        return `eq-${hash8(block.title)}`;
    }
    return null;
}

/** 收集 [[title]] 引用 */
export function collectRefs(blocks: Block[]): Set<string> {
    const refs = new Set<string>();
    const re = /\[\[([^\]]+)\]\]/g;
    for (const b of blocks) {
        if (b.type === 'text') {
            let m: RegExpExecArray | null;
            while ((m = re.exec(b.content)) !== null) {
                refs.add(m[1]);
            }
        }
    }
    return refs;
}

export function collectTitles(blocks: Block[]): Set<string> {
    const titles = new Set<string>();
    for (const b of blocks) {
        if (b.type !== 'text' && b.title.trim()) {
            titles.add(b.title);
        }
    }
    return titles;
}

export interface TitleStatus {
    empty: boolean;
    duplicate: boolean;
}

/** 检查某卡片标题是否为空 / 重复 */
export function checkTitle(
    blocks: Block[],
    uid: string,
    title: string,
    required: boolean,
): TitleStatus {
    const trimmed = title.trim();
    const empty = required && !trimmed;
    let duplicate = false;
    if (trimmed) {
        duplicate = blocks.some(
            (b) => b.uid !== uid && b.type !== 'text' && b.title.trim() === trimmed,
        );
    }
    return { empty, duplicate };
}