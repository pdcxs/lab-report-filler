import {
    Accordion,
    Badge,
    List,
    Paper,
    Text,
    Title,
} from '@mantine/core';
import type { Experiment } from '../types/lab-config';
import { useLabStore } from '../state/useLabStore';
import { pickLocalized, pickLocalizedList, useT } from '../i18n/useT';

export function LabReadOnlyPanel({ experiment }: { experiment: Experiment }) {
    const lang = useLabStore((s) => s.lang);
    const t = useT();

    const objectives = pickLocalizedList(experiment.objectives, lang);
    const content = pickLocalizedList(experiment.content, lang);
    const guide = pickLocalizedList(experiment.recordGuide, lang);

    return (
        <Paper withBorder p="md">
            <Title order={3} mb="xs">
                {pickLocalized(experiment.name, lang)}
            </Title>

            <Accordion
                variant="separated"
                multiple
                defaultValue={['objectives', 'content', 'guide']}
            >
                <Accordion.Item value="objectives">
                    <Accordion.Control>
                        <Text fw={600}>
                            {t('objectives')}
                            <Badge size="xs" variant="light" ml="xs">
                                {t('readOnly')}
                            </Badge>
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <List type="ordered" spacing="xs">
                            {objectives.map((o, i) => (
                                <List.Item key={i}>{o}</List.Item>
                            ))}
                        </List>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="content">
                    <Accordion.Control>
                        <Text fw={600}>
                            {t('content')}
                            <Badge size="xs" variant="light" ml="xs">
                                {t('readOnly')}
                            </Badge>
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <List spacing="xs" icon={<span style={{ width: 4 }} />}>
                            {content.map((c, i) => (
                                <List.Item key={i}>
                                    <Text style={{ whiteSpace: 'pre-wrap' }}>{c}</Text>
                                </List.Item>
                            ))}
                        </List>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="guide">
                    <Accordion.Control>
                        <Text fw={600}>{t('guideTitle')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <List spacing="xs">
                            {guide.map((g, i) => (
                                <List.Item key={i}>{g}</List.Item>
                            ))}
                        </List>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Paper>
    );
}