import { useEffect } from 'react';
import { Box } from '@mantine/core';
import { useLabStore } from './state/useLabStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Workspace } from './components/Workspace';

export default function App() {
  const dir = useLabStore((s) => s.dir);
  const init = useLabStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {dir ? <Workspace /> : <WelcomeScreen />}
    </Box>
  );
}