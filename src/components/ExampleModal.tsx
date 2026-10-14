import { Button, Code, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { useT } from '../i18n/useT';

interface Props {
    opened: boolean;
    onClose: () => void;
    example: string;
    onCopy: () => void;
}

export function ExampleModal({ opened, onClose, example, onCopy }: Props) {
    const t = useT();
    return (
        <Modal opened={opened} onClose={onClose} title={t('exampleModalTitle')} size="xl">
            <Stack gap="sm">
                <Text c="red" size="sm">
                    {t('exampleWarning')}
                </Text>
                <ScrollArea h={500}>
                    <Code block style={{ whiteSpace: 'pre-wrap' }}>
                        {example}
                    </Code>
                </ScrollArea>
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={onCopy}>{t('copyToEditor')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
}