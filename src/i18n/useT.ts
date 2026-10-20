import { useLabStore } from '../state/useLabStore';
import { strings, type Language } from './strings';

export function useT() {
    const config = useLabStore((s) => s.config);

    const lang: Language = (config?.language as Language) ?? 'zh';

    return (
        key: keyof typeof strings.en,
        vars?: Record<string, string | number>,
    ): string => {
        let text: string = strings[lang][key] ?? String(key);
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                text = text.replaceAll(`{${k}}`, String(v));
            }
        }
        return text;
    };
}