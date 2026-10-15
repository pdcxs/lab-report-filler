import {
  Box,
  Button,
  Code,
  Group,
  List,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useLabStore } from '../state/useLabStore';

export function TypstMissingModal() {
  const typstAvailable = useLabStore((s) => s.typstAvailable);
  const typstMessage = useLabStore((s) => s.typstMessage);
  const checkTypst = useLabStore((s) => s.checkTypst);

  const opened = typstAvailable === false;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        /* 不允许关闭 */
      }}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="lg"
      centered
      title={<Title order={4}>Typst is not installed / 未检测到 Typst</Title>}
    >
      <Stack gap="md">
        <Text>
          This app uses <b>Typst</b> to compile your report into a PDF.
          Typst was not found on your system. Please install it and then
          click <b>Retry</b>.
        </Text>
        <Text size="sm" c="dimmed">
          本程序使用 <b>Typst</b> 编译生成 PDF。系统中未检测到 Typst，
          请先安装，然后点击 <b>重试</b>。
        </Text>

        <Box>
          <Text fw={600} mb="xs">
            Installation / 安装方法
          </Text>
          <List spacing="xs" size="sm">
            <List.Item>
              <b>Arch Linux</b>：
              <Code block>sudo pacman -S typst</Code>
            </List.Item>
            <List.Item>
              <b>Ubuntu / Debian</b>：
              <Code block>sudo apt install typst</Code>
              <Text size="xs" c="dimmed" mt={4}>
                If not available in your sources: <Code>cargo install typst-cli</Code>
              </Text>
            </List.Item>
            <List.Item>
              <b>Fedora</b>：
              <Code block>sudo dnf install typst</Code>
            </List.Item>
            <List.Item>
              <b>Any system with Rust</b>：
              <Code block>cargo install typst-cli</Code>
            </List.Item>
          </List>

          <Text size="xs" c="dimmed" mt="sm">
            After installation, make sure <Code>typst --version</Code> works
            in a terminal.
          </Text>
        </Box>

        {typstMessage && (
          <Box
            style={{
              background: 'var(--mantine-color-gray-1)',
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Text size="xs" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {typstMessage}
            </Text>
          </Box>
        )}

        <Group justify="flex-end">
          <Button onClick={() => void checkTypst()}>Retry / 重试</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
