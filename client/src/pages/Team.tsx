import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  ActionIcon,
  Modal,
} from '@mantine/core';
import { UserPlus, Trash, ShieldAlert } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { api, type Workspace, type WorkspaceMember } from '../lib/api';

const Team = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedWorkspaces = await api.getWorkspaces();
      setWorkspaces(fetchedWorkspaces);
      if (fetchedWorkspaces.length > 0) {
        setSelectedWorkspace(fetchedWorkspaces[0]._id);
        const fetchedMembers = await api.getWorkspaceMembers(fetchedWorkspaces[0]._id);
        setMembers(fetchedMembers);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;
    setInviting(true);
    try {
      const newMember = await api.inviteWorkspaceMember(selectedWorkspace, inviteEmail, inviteRole);
      setMembers([...members, newMember]);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('viewer');
      notifications.show({ title: 'Success', message: 'Member invited successfully', color: 'teal' });
    } catch (err) {
      notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!selectedWorkspace) return;
    try {
      const updated = await api.updateWorkspaceMember(selectedWorkspace, memberId, role);
      setMembers(members.map((m) => (m._id === memberId ? updated : m)));
      notifications.show({ title: 'Success', message: 'Role updated', color: 'teal' });
    } catch (err) {
      notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!selectedWorkspace) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeWorkspaceMember(selectedWorkspace, memberId);
      setMembers(members.filter((m) => m._id !== memberId));
      notifications.show({ title: 'Success', message: 'Member removed', color: 'teal' });
    } catch (err) {
      notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' });
    }
  };

  const activeWorkspace = workspaces.find((w) => w._id === selectedWorkspace);

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={3} style={{ color: 'white' }}>
            Team Collaboration
          </Title>
          <Text c="dimmed" size="sm">
            Manage your workspace members and their roles.
          </Text>
        </div>
        <Button
          color="indigo"
          leftSection={<UserPlus size={16} />}
          onClick={() => setInviteModalOpen(true)}
          disabled={!activeWorkspace || activeWorkspace.role !== 'owner'}
        >
          Invite Member
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="Error loading team data">
          {error}
        </Alert>
      )}

      {loading ? (
        <Text c="dimmed">Loading...</Text>
      ) : workspaces.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="#818CF8" style={{ marginBottom: 16, opacity: 0.8 }} />
          <Title order={4} mb="sm" style={{ color: 'white' }}>
            No Workspace Found
          </Title>
          <Text c="dimmed">You must complete onboarding to create or join a workspace.</Text>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <Group mb="lg">
            <Select
              label="Active Workspace"
              data={workspaces.map((w) => ({ value: w._id, label: w.name }))}
              value={selectedWorkspace}
              onChange={async (val) => {
                setSelectedWorkspace(val);
                if (val) {
                  setLoading(true);
                  try {
                    const fetchedMembers = await api.getWorkspaceMembers(val);
                    setMembers(fetchedMembers);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }
              }}
            />
            <Box mt="xl">
              <Badge color="indigo" variant="light">
                Your Role: {activeWorkspace?.role.toUpperCase()}
              </Badge>
            </Box>
          </Group>

          <Table verticalSpacing="sm" style={{ color: 'var(--text-secondary)' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>USER</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>EMAIL</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>ROLE</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>ACTIONS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.map((member) => (
                <Table.Tr key={member._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="indigo" radius="xl">
                        {member.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text size="sm" fw={500} style={{ color: 'white' }}>
                        {member.fullName}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{member.email}</Table.Td>
                  <Table.Td>
                    <Select
                      data={['owner', 'editor', 'viewer']}
                      value={member.role}
                      onChange={(val) => val && handleUpdateRole(member._id, val)}
                      disabled={activeWorkspace?.role !== 'owner'}
                      variant="unstyled"
                      styles={{ input: { color: 'var(--text-secondary)', width: 100 } }}
                    />
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemove(member._id)}
                      disabled={activeWorkspace?.role !== 'owner'}
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <Modal opened={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Team Member" centered>
        <form onSubmit={handleInvite}>
          <TextInput
            label="User Email"
            placeholder="colleague@example.com"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
            mb="md"
          />
          <Select
            label="Role"
            data={[
              { value: 'owner', label: 'Owner (Full Access)' },
              { value: 'editor', label: 'Editor (Can modify schemas and mocks)' },
              { value: 'viewer', label: 'Viewer (Read-only)' },
            ]}
            value={inviteRole}
            onChange={(val) => val && setInviteRole(val)}
            mb="xl"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="indigo" type="submit" loading={inviting}>
              Send Invite
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
};

export default Team;
