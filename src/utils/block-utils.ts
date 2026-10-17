import type { Block } from '../types/lab-config';

/** 与 Rust 侧 `Block::label()` 完全一致 */
function fnv1a(s: string): number {
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
    }
    return hash;
}

function hash8(s: string): string {
    return fnv1a(s).toString(16).padStart(8, '0');
}

export function labelFor(block: Block): string | null {
    if (block.type === 'text') return null;
    const h = hash8(block.uid);
    if (block.type === 'image') return `fig-${h}`;
    if (block.type === 'code') return `code-${h}`;
    if (block.type === 'math') {
        if (!block.title.trim()) return null;
        return `eq-${h}`;
    }
    return null;
}

/** 判断 [[X]] 中的 X 是 title 引用还是 title-uid 组合引用 */
export interface RefTarget {
    type: 'title' | 'exact';
    title: string;
}

/**
 * 尝试把一个 block 解析成 `title-uid` 形式（按钮插入用）。
 * 因为 uid 固定 8 位 [a-z0-9]，从末尾取 8 位即可。
 */
export function exactRefText(block: Block): string | null {
    if (block.type === 'text' || !block.title.trim()) return null;
    return `${block.title}-${block.uid}`;
}

/**
 * 收集文本块里的所有 `[[X]]`。
 * 对每个 X，尝试匹配：
 *   1. 精确的 title-uid → 唯一 block
 *   2. 纯 title → 可能多个
 */
export function collectRefs(blocks: Block[]): Map<string, Block[]> {
    // X → 匹配到的 blocks（用于后续判断歧义与引用状态）
    const result = new Map<string, Block[]>();
    const re = /\[\[([^\]]+)\]\]/g;

    const resolved = new Map<string, Block[]>();
    for (const b of blocks) {
        if (b.type === 'text') continue;
        const key = exactRefText(b);
        if (key) resolved.set(key, [...(resolved.get(key) ?? []), b]);
        // 同时允许仅 title 引用
        const titleKey = b.title.trim();
        if (titleKey) {
            const prev = resolved.get(titleKey) ?? [];
            resolved.set(titleKey, [...prev, b]);
        }
    }

    for (const b of blocks) {
        if (b.type === 'text') continue;
    }

    // 重新遍历文本块
    for (const text of blocks) {
        if (text.type !== 'text') continue;
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(text.content)) !== null) {
            const X = m[1];
            // 优先精确匹配 title-uid
            const exactKey = Array.from(resolved.keys()).find((k) => {
                if (!k.includes('-')) return false;
                return k === X;
            });
            if (exactKey && resolved.has(exactKey)) {
                result.set(X, resolved.get(exactKey)!);
                continue;
            }
            // 再按 title 匹配
            if (resolved.has(X)) {
                // 只保留 title 匹配（不会与 title-uid 混在一起，因为 title-uid 一定含 -uid 后缀）
                const candidates = resolved.get(X)!;
                result.set(X, candidates);
            }
        }
    }

    return result;
}

/** 返回所有"未被任何引用覆盖"的 block（有 title 的） */
export function unreferencedBlocks(blocks: Block[]): Block[] {
    const refs = collectRefs(blocks);
    const referencedLabels = new Set<string>();

    for (const [, blocksList] of refs.entries()) {
        // 精确引用覆盖所有候选；title 引用只覆盖第一个
        if (blocksList.length > 0) {
            referencedLabels.add(blocksList[0].uid);
        }
    }

    return blocks.filter((b) => {
        if (b.type === 'text') return false;
        if (!b.title.trim()) return false;
        return !referencedLabels.has(b.uid);
    });
}

/** 歧义：某 title 对应多个 block，且被 [[title]] 引用（非 title-uid） */
export function ambiguousRefs(blocks: Block[]): string[] {
    const refs = collectRefs(blocks);
    const titleCount = new Map<string, number>();
    for (const b of blocks) {
        if (b.type === 'text') continue;
        const t = b.title.trim();
        if (t) titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
    }

    const result: string[] = [];
    for (const [X, _] of refs.entries()) {
        // 如果 X 是 title-uid 形式（能精确匹配到某个 block），跳过
        const exactMatch = blocks.some(
            (b) => b.type !== 'text' && exactRefText(b) === X,
        );
        if (exactMatch) continue;
        // 纯 title 引用，且 title 有多个匹配
        if (titleCount.get(X) && titleCount.get(X)! > 1) {
            result.push(X);
        }
    }
    return result;
}

/** 找出某个文本块中所有歧义的引用 title（同名 block 被纯 title 引用） */
export function ambiguousRefsInText(
    textContent: string,
    allBlocks: Block[],
): string[] {
    const titleCount = new Map<string, number>();
    const exactKeys = new Set<string>();
    for (const b of allBlocks) {
        if (b.type === 'text' || !b.title.trim()) continue;
        const t = b.title.trim();
        titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
        exactKeys.add(`${t}-${b.uid}`);
    }

    const result: string[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(textContent)) !== null) {
        const x = m[1];
        if (exactKeys.has(x)) continue; // 精确 title-uid 引用，无歧义
        if ((titleCount.get(x) ?? 0) > 1 && !result.includes(x)) {
            result.push(x);
        }
    }
    return result;
}