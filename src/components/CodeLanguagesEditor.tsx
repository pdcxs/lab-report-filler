import { ActionIcon, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import type { CodeLanguage } from '../types/lab-config';
import { useT } from '../i18n/useT';
import { DEFAULT_LANG_EXTS } from '../utils/constants';

interface Props {
    value: CodeLanguage[];
    onChange: (v: CodeLanguage[]) => void;
}

export function CodeLanguagesEditor({ value, onChange }: Props) {
    const t = useT();

    const update = (idx: number, patch: Partial<CodeLanguage>) => {
        onChange(value.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    };

    const remove = (idx: number) => {
        onChange(value.filter((_, i) => i !== idx));
    };

    const add = () => {
        onChange([...value, { name: '' }]);
    };

    return (
        <Stack gap="xs">
            <Text size="xs" c="dimmed">
                {t('codeLanguagesHint')}
            </Text>
            {value.map((lang, idx) => {
                const defaults = DEFAULT_LANG_EXTS[lang.name] ?? [];
                const extStr = lang.extensions?.join(', ') ?? '';
                const placeholder = defaults.length > 0
                    ? t('codeLanguageExtPlaceholder', { exts: defaults.join(', ') })
                    : t('codeLanguageExtEmpty');
                return (
                    <Group key={idx} gap="xs" wrap="nowrap" align="flex-start">
                        <TextInput
                            placeholder={t('codeLanguageName')}
                            value={lang.name}
                            onChange={(e) => update(idx, { name: e.currentTarget.value })}
                            w={150}
                        />
                        <TextInput
                            placeholder={placeholder}
                            value={extStr}
                            onChange={(e) => {
                                const raw = e.currentTarget.value;
                                if (!raw.trim()) {
                                    update(idx, { extensions: undefined });
                                } else {
                                    const exts = raw
                                        .split(',')
                                        .map((s) => s.trim().toLowerCase())
                                        .filter(Boolean);
                                    update(idx, { extensions: exts });
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="lg"
                            onClick={() => remove(idx)}
                        >
                            <IconX size={16} />
                        </ActionIcon>
                    </Group>
                );
            })}
            <Button
                variant="default"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={add}
                style={{ alignSelf: 'flex-start' }}
            >
                {t('codeLanguageAdd')}
            </Button>
        </Stack>
    );
}