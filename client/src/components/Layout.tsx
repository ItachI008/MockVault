import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AppShell } from '@mantine/core';

const Layout = () => {
  return (
    <AppShell
      navbar={{
        width: 260,
        breakpoint: 'sm',
      }}
      padding="md"
      styles={{
        main: {
          background: 'var(--bg-color)',
          color: 'var(--text-primary)',
          paddingTop: '20px',
        },
      }}
    >
      <AppShell.Navbar p="md" style={{ background: '#0F111A', borderRight: '1px solid var(--border-color)' }}>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default Layout;
