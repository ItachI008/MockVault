import { useState, type FormEvent } from 'react';
import { Box, Button, Group, Text, TextInput, Title } from '@mantine/core';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, saveAuthSession, getStoredUser } from '../lib/api';

const Onboarding = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [workspaceName, setWorkspaceName] = useState(`${user?.fullName || 'My'} Workspace`);
  const [loading, setLoading] = useState(false);

  const handleComplete = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.completeOnboarding({ workspaceName });
      // Update local storage user with isOnboarded = true
      const token = localStorage.getItem('mockvault_token') || '';
      saveAuthSession({ token, user: response });
      navigate('/app');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', alignItems: 'center', justifyContent: 'center' }}>
      <Group gap="sm" mb="xl">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={24} color="white" />
        </div>
        <Title order={2} style={{ color: 'white' }}>MockVault</Title>
      </Group>

      <Box style={{ maxWidth: 460, width: '100%', padding: '40px' }} className="glass-panel">
        <Title order={3} mb="sm" style={{ color: 'white', textAlign: 'center' }}>
          Welcome, {user?.fullName?.split(' ')[0] || 'there'}! 👋
        </Title>
        <Text c="dimmed" ta="center" mb="xl">
          Let's set up your workspace so you can start creating APIs.
        </Text>

        <form onSubmit={handleComplete}>
          <TextInput
            label="Workspace Name"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.currentTarget.value)}
            mb="xl"
            required
            styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' }, label: { color: 'var(--text-secondary)' } }}
          />

          <Button fullWidth color="indigo" size="md" type="submit" loading={loading}>
            Get Started
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Onboarding;
