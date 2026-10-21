import { useEffect } from 'react';
import { Box } from '@mantine/core';
import { useLabStore } from './state/useLabStore';
import { RoleSelection } from './components/RoleSelection';
import { StudentWelcome } from './components/StudentWelcome';
import { TeacherWorkspace } from './components/TeacherWorkspace';
import { Workspace } from './components/Workspace';
import { AppModals } from './components/modals';

export default function App() {
  const dir = useLabStore((s) => s.dir);
  const role = useLabStore((s) => s.role);
  const init = useLabStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  let content;
  if (role === null) {
    content = <RoleSelection />;
  } else if (role === 'teacher') {
    content = <TeacherWorkspace />;
  } else if (dir) {
    content = <Workspace />;
  } else {
    content = <StudentWelcome />;
  }

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {content}
      <AppModals />
    </Box>
  );
}
