import { Accordion, Badge, List, Paper, Text, Title } from '@mantine/core';
import type { Experiment } from '../types/lab-config';
import { useT } from '../i18n/useT';

export function LabReadOnlyPanel({ experiment }: { experiment: Experiment }) {
    const t = useT();

    return (
        <Paper withBorder p="md">
            <Title order={3} mb="xs">
                {experiment.name}
            </Title>

            <Accordion variant="separated" multiple defaultValue={['objectives', 'content', 'guide']}>
                <Accordion.Item value="objectives">
                    <Accordion.Control>
                        <Text fw={600} component="span">
                            {t('objectives')}
                        </Text>
                        <Badge size="xs" variant="light" ml="xs">
                            {t('readOnly')}
                        </Badge>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text style={{ whiteSpace: 'pre-wrap' }}>{experiment.objectives}</Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="content">
                    <Accordion.Control>
                        <Text fw={600} component="span">
                            {t('content')}
                        </Text>
                        <Badge size="xs" variant="light" ml="xs">
                            {t('readOnly')}
                        </Badge>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text style={{ whiteSpace: 'pre-wrap' }}>{experiment.content}</Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="guide">
                    <Accordion.Control>
                        <Text fw={600} component="span">
                            {t('guideTitle')}
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <List spacing="xs">
                            {experiment.recordGuide.map((g, i) => (
                                <List.Item key={i}>{g}</List.Item>
                            ))}
                        </List>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Paper>
    );
}