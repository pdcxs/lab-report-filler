import { useLabStore } from '../state/useLabStore';
import type { LocalizedString } from '../types/lab-config';

export function pickLocalized(obj: LocalizedString | undefined, lang: string): string {
    if (!obj) return '';
    return lang === 'zh' ? obj.zh : obj.en;
}

export function pickLocalizedList(
    obj: { en: string[]; zh: string[] } | undefined,
    lang: string,
): string[] {
    if (!obj) return [];
    return lang === 'zh' ? obj.zh : obj.en;
}

export function useT() {
    const lang = useLabStore((s) => s.lang);
    const config = useLabStore((s) => s.config);

    return (key: string, vars?: Record<string, string | number>): string => {
        const strings = config?.ui.strings;
        const entry = strings?.[key];
        let text = entry ? (lang === 'zh' ? entry.zh : entry.en) : key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                text = text.replaceAll(`{${k}}`, String(v));
            }
        }
        return text;
    };
}