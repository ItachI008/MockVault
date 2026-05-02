import { NavLink } from 'react-router-dom';
import { Avatar, Box, Group, Stack, Text } from '@mantine/core';
import { Database, LayoutDashboard, Server, Settings, ShieldCheck, Users, History } from 'lucide-react';
import { api, getStoredUser } from '../lib/api';
import { useEffect, useState } from 'react';

const MOCKVAULT_LOGO = (
  <Group gap="sm" mb="xl" px="xs">
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
      }}
    >
      <Database size={18} color="white" />
    </div>
    <Text fw={700} size="xl" variant="gradient" gradient={{ from: 'white', to: '#A5B4FC', deg: 90 }}>
      MockVault
    </Text>
  </Group>
);

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { label: 'Schema Designer', icon: Database, path: '/app/schemas' },
  { label: 'Version Control', icon: History, path: '/app/versions' },
  { label: 'Mock Server', icon: Server, path: '/app/mocks' },
  { label: 'Contract Tests', icon: ShieldCheck, path: '/app/contracts' },
  { label: 'Team', icon: Users, path: '/app/team' },
  { label: 'Settings', icon: Settings, path: '/app/settings' },
];

const Sidebar = () => {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const user = getStoredUser();

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  useEffect(() => {
    api
      .getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {MOCKVAULT_LOGO}

      <Stack gap="xs" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              textDecoration: 'none',
              color: isActive ? 'white' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              padding: '10px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            })}
          >
            {({ isActive }) => (
              <Group gap="sm">
                <item.icon size={18} color={isActive ? '#818CF8' : 'currentColor'} />
                <Text size="sm" fw={isActive ? 600 : 500}>
                  {item.label}
                </Text>
              </Group>
            )}
          </NavLink>
        ))}
      </Stack>

      {/* User profile strip */}
      <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--border-color)' }}>
        <Group gap="sm" mb="md" px="xs">
          <Avatar
            size={36}
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              fontWeight: 700,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box style={{ overflow: 'hidden', flex: 1 }}>
            <Text size="sm" fw={600} style={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName ?? 'User'}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email ?? ''}
            </Text>
          </Box>
        </Group>

        {/* API status */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            API CONNECTION
          </Text>
          <Group gap="xs">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  apiOnline === true ? '#10B981' : apiOnline === false ? '#EF4444' : '#F59E0B',
                flexShrink: 0,
              }}
            />
            <Text size="sm" fw={500}>
              {apiOnline === true ? 'Backend online' : apiOnline === false ? 'Backend offline' : 'Checking…'}
            </Text>
          </Group>
        </div>
      </Box>
    </Box>
  );
};

export default Sidebar;
