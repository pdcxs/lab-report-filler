import { Button, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { useT } from '../i18n/useT';

interface Props {
    opened: boolean;
    onClose: () => void;
    content: string;
    onPick: (ref: string) => void;
}

function extractLabels(content: string): string[] {
    const re = /<([a-zA-Z][a-zA-Z0-9_\-:.]*)>/g;
    const labels = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
        labels.add(m[1]);
    }
    return Array.from(labels);
}

export function ReferencePicker({ opened, onClose, content, onPick }: Props) {
    const t = useT();
    const labels = extractLabels(content);

    return (
        <Modal opened={opened} onClose={onClose} title={t('insertReference')}>
            <Stack gap="xs">
                {labels.length === 0 ? (
                    <Text c="dimmed">
                        No labeled figures found in this record yet. Insert an image first.
                    </Text>
                ) : (
                    <ScrollArea h={300}>
                        <Stack gap="xs">
                            {labels.map((l) => (
                                <Button key={l} variant="light" onClick={() => onPick(`@${l}`)}>
                                    @{l}
                                </Button>
                            ))}
                        </Stack>
                    </ScrollArea>
                )}
            </Stack>
        </Modal>
    );
}