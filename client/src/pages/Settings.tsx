import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core';
import { LogOut, Mail, ShieldCheck, User } from 'lucide-react';
import { clearAuthSession, getStoredUser } from '../lib/api';

const Settings = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleLogout = () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      return;
    }
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <Box p="lg">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={3} style={{ color: 'white' }}>
            Settings
          </Title>
          <Text c="dimmed" size="sm">
            Manage your account details and preferences.
          </Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* ── Profile card ── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="lg" style={{ letterSpacing: 1 }}>
            Account Profile
          </Text>

          <Group mb="xl" gap="lg">
            <Avatar
              size={64}
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <Text fw={700} size="lg" style={{ color: 'white' }}>
                {user?.fullName ?? 'Unknown User'}
              </Text>
              <Badge color="indigo" variant="light" mt={4}>
                PRO MEMBER
              </Badge>
            </div>
          </Group>

          <Divider mb="lg" color="rgba(255,255,255,0.06)" />

          {/* Email row */}
          <Group mb="md" gap="sm">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mail size={16} color="#818CF8" />
            </div>
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.5 }}>
                Email Address
              </Text>
              <Text size="sm" style={{ color: 'white' }}>
                {user?.email ?? '—'}
              </Text>
            </div>
          </Group>

          {/* User ID row */}
          <Group gap="sm">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} color="#818CF8" />
            </div>
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.5 }}>
                User ID
              </Text>
              <Text size="sm" style={{ color: 'white', fontFamily: 'monospace' }}>
                {user?.id ?? '—'}
              </Text>
            </div>
          </Group>
        </div>

        {/* ── Plan card ── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="lg" style={{ letterSpacing: 1 }}>
            Plan & Permissions
          </Text>

          <Group mb="xl" gap="md" align="flex-start">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(16,185,129,0.3)',
              }}
            >
              <ShieldCheck size={24} color="white" />
            </div>
            <div>
              <Text fw={700} size="lg" style={{ color: 'white' }}>
                Pro Plan
              </Text>
              <Text size="sm" c="dimmed">
                Unlimited schemas, endpoints & contract tests
              </Text>
            </div>
          </Group>

          <Divider mb="lg" color="rgba(255,255,255,0.06)" />

          {[
            { label: 'Schemas', value: 'Unlimited' },
            { label: 'Mock endpoints', value: 'Unlimited' },
            { label: 'Contract tests', value: 'Unlimited' },
            { label: 'Live mock server', value: 'Included' },
          ].map((feature) => (
            <Group key={feature.label} justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                {feature.label}
              </Text>
              <Badge color="teal" variant="light" size="sm">
                {feature.value}
              </Badge>
            </Group>
          ))}
        </div>
      </SimpleGrid>

      {/* ── Danger zone ── */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          marginTop: '24px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <Text size="xs" fw={700} c="red" tt="uppercase" mb="sm" style={{ letterSpacing: 1 }}>
          Danger Zone
        </Text>
        <Text size="sm" c="dimmed" mb="lg">
          Logging out will end your session and return you to the login screen. All unsaved changes
          will be lost.
        </Text>

        {logoutConfirm && (
          <Alert color="red" mb="md" title="Are you sure?">
            Click "Confirm Logout" again to end your session.
          </Alert>
        )}

        <Group>
          <Button
            color="red"
            variant={logoutConfirm ? 'filled' : 'light'}
            leftSection={<LogOut size={16} />}
            onClick={handleLogout}
          >
            {logoutConfirm ? 'Confirm Logout' : 'Log Out'}
          </Button>
          {logoutConfirm && (
            <Button variant="subtle" onClick={() => setLogoutConfirm(false)}>
              Cancel
            </Button>
          )}
        </Group>
      </div>
    </Box>
  );
};

export default Settings;
