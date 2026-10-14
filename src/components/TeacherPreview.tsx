import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Group,
    ScrollArea,
    Text,
} from '@mantine/core';
import { invoke } from '@tauri-apps/api/core';
import { useTeacherStore } from '../state/useTeacherStore';

interface Props {
    logoPath: string | null;
}

export function TeacherPreview({ logoPath }: Props) {
    const config = useTeacherStore((s) => s.config);
    const [pages, setPages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await invoke<string[]>('preview_teacher_config', {
                config,
                logoPath,
            });
            setPages(result);
        } catch (e) {
            setError(String(e));
            setPages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => void refresh(), 800);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, logoPath]);

    return (
        <Box
            style={{
                width: '40%',
                minWidth: 320,
                maxWidth: 720,
                flexShrink: 0,
                borderLeft: '1px solid var(--mantine-color-gray-3)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--mantine-color-gray-1)',
            }}
        >
            <Group
                justify="space-between"
                p="xs"
                px="md"
                style={{
                    borderBottom: '1px solid var(--mantine-color-gray-3)',
                    background: 'var(--mantine-color-body)',
                    flexShrink: 0,
                }}
            >
                <Text fw={600}>预览</Text>
                <Button size="xs" variant="light" loading={loading} onClick={() => void refresh()}>
                    刷新
                </Button>
            </Group>

            <ScrollArea style={{ flex: 1 }} p="md">
                {error && (
                    <Alert color="red" mb="md" title="Typst 编译错误">
                        <Text
                            size="xs"
                            style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                        >
                            {error}
                        </Text>
                    </Alert>
                )}
                {pages.length === 0 && !error && !loading && (
                    <Text c="dimmed">暂无预览</Text>
                )}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    {pages.map((svg, i) => (
                        <Box
                            key={i}
                            className="preview-page"
                            style={{
                                background: 'white',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                width: '100%',
                            }}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    ))}
                </div>
            </ScrollArea>
        </Box>
    );
}