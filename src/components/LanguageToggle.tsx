import { ActionIcon, Tooltip } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';

export function LanguageToggle() {
    const lang = useLabStore((s) => s.lang);
    const setLang = useLabStore((s) => s.setLang);
    return (
        <Tooltip label={lang === 'en' ? '切换到中文' : 'Switch to English'}>
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            >
                🌐
            </ActionIcon>
        </Tooltip>
    );
}