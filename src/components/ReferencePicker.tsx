import { Button, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { useLabStore } from '../state/useLabStore';
import { useT } from '../i18n/useT';

interface Props {
    opened: boolean;
    labId: string;
    content: string;
    onClose: () => void;
    onPick: (ref: string) => void;
}

const EMPTY: never[] = [];

export function ReferencePicker({ opened, labId, content, onClose, onPick }: Props) {
    const t = useT();
    // 只取 labels 对象本身（引用稳定），不要在里面用 ?? [] 创建新数组
    const allLabels = useLabStore((s) => s.student.labels);
    const labels = allLabels[labId] ?? EMPTY;

    const available = labels.filter((l) => content.includes(`<${l.label}>`));

    return (
        <Modal opened={opened} onClose={onClose} title={t('insertReference')}>
            <Stack gap="xs">
                {available.length === 0 ? (
                    <Text c="dimmed">
                        No labeled figures or code blocks found in this record yet.
                    </Text>
                ) : (
                    <ScrollArea h={300}>
                        <Stack gap="xs">
                            {available.map((l) => (
                                <Button
                                    key={l.label}
                                    variant="light"
                                    onClick={() => onPick(`@${l.label}`)}
                                >
                                    @{l.label} — {l.title} ({l.kind})
                                </Button>
                            ))}
                        </Stack>
                    </ScrollArea>
                )}
            </Stack>
        </Modal>
    );
}