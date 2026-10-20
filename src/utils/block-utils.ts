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

export interface RefTarget {
    type: 'title' | 'exact';
    title: string;
}

export function labelFor(block: Block): string | null {
    if (block.type === 'text' || block.type === 'heading') return null;
    const h = hash8(block.uid);
    if (block.type === 'image') return `fig-${h}`;
    if (block.type === 'code') return `code-${h}`;
    if (block.type === 'math') {
        if (!block.title.trim()) return null;
        return `eq-${h}`;
    }
    return null;
}

export function exactRefText(block: Block): string | null {
    if (block.type === 'text' || block.type === 'heading' || !block.title.trim()) {
        return null;
    }
    return `${block.title}-${block.uid}`;
}

export function collectRefs(blocks: Block[]): Map<string, Block[]> {
    const result = new Map<string, Block[]>();
    const re = /\[\[([^\]]+)\]\]/g;

    const resolved = new Map<string, Block[]>();
    for (const b of blocks) {
        if (b.type === 'text' || b.type === 'heading') continue;
        const key = exactRefText(b);
        if (key) resolved.set(key, [...(resolved.get(key) ?? []), b]);
        const titleKey = b.title.trim();
        if (titleKey) {
            const prev = resolved.get(titleKey) ?? [];
            resolved.set(titleKey, [...prev, b]);
        }
    }

    for (const text of blocks) {
        if (text.type !== 'text' || text.raw) continue;
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(text.content)) !== null) {
            const X = m[1];
            const exactKey = Array.from(resolved.keys()).find((k) => {
                if (!k.includes('-')) return false;
                return k === X;
            });
            if (exactKey && resolved.has(exactKey)) {
                result.set(X, resolved.get(exactKey)!);
                continue;
            }
            if (resolved.has(X)) {
                result.set(X, resolved.get(X)!);
            }
        }
    }

    return result;
}

export function unreferencedBlocks(blocks: Block[]): Block[] {
    const refs = collectRefs(blocks);
    const referencedUids = new Set<string>();

    for (const [, blocksList] of refs.entries()) {
        if (blocksList.length > 0) {
            referencedUids.add(blocksList[0].uid);
        }
    }

    return blocks.filter((b) => {
        if (b.type === 'text' || b.type === 'heading') return false;
        if (!b.title.trim()) return false;
        return !referencedUids.has(b.uid);
    });
}

export function ambiguousRefs(blocks: Block[]): string[] {
    const refs = collectRefs(blocks);
    const titleCount = new Map<string, number>();
    for (const b of blocks) {
        if (b.type === 'text' || b.type === 'heading') continue;
        const t = b.title.trim();
        if (t) titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
    }

    const result: string[] = [];
    for (const [X] of refs.entries()) {
        const exactMatch = blocks.some(
            (b) =>
                b.type !== 'text' && b.type !== 'heading' && exactRefText(b) === X,
        );
        if (exactMatch) continue;
        if (titleCount.get(X) && titleCount.get(X)! > 1) {
            result.push(X);
        }
    }
    return result;
}

export function ambiguousRefsInText(
    textContent: string,
    allBlocks: Block[],
): string[] {
    const titleCount = new Map<string, number>();
    const exactKeys = new Set<string>();
    for (const b of allBlocks) {
        if (b.type === 'text' || b.type === 'heading' || !b.title.trim()) continue;
        const t = b.title.trim();
        titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
        exactKeys.add(`${t}-${b.uid}`);
    }

    const result: string[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(textContent)) !== null) {
        const x = m[1];
        if (exactKeys.has(x)) continue;
        if ((titleCount.get(x) ?? 0) > 1 && !result.includes(x)) {
            result.push(x);
        }
    }
    return result;
}