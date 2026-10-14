/**
 * Typst label 允许的字符：字母、数字、-、_、:、.
 * 必须以字母开头。
 * 返回清理后的 label；如果清理后为空，返回空串。
 */
export function sanitizeLabel(raw: string): string {
    const cleaned = raw.replace(/[^A-Za-z0-9_\-:.]/g, '');
    // Typst label 必须以字母开头
    if (!/^[A-Za-z]/.test(cleaned)) return '';
    return cleaned;
}

/**
 * 从任意字符串生成合法的 Typst label。
 * 例如 "Result of Experiment 1" → "result-of-experiment-1"
 */
export function slugifyLabel(raw: string): string {
    const cleaned = raw
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return cleaned || 'label';
}