import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Box, Button, Group, Loader, SimpleGrid, Table, Text, Title } from '@mantine/core';
import { Activity, Database, Plus, Server, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type DashboardResponse, type MockEndpoint } from '../lib/api';

const methodColor = (method: MockEndpoint['method']) => {
  if (method === 'GET') return 'blue';
  if (method === 'POST') return 'teal';
  if (method === 'DELETE') return 'red';
  if (method === 'PATCH') return 'violet';
  return 'orange';
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((data) => {
        setDashboard(data);
        setError(null);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(
    () => [
      {
        title: 'Saved Schemas',
        value: dashboard ? String(dashboard.metrics.schemaCount) : '0',
        icon: Database,
        color: 'indigo',
      },
      {
        title: 'Active Endpoints',
        value: dashboard
          ? `${dashboard.metrics.activeEndpointCount} / ${dashboard.metrics.endpointCount}`
          : '0 / 0',
        icon: Server,
        color: 'blue',
      },
      {
        title: 'Contract Health',
        value: dashboard ? `${dashboard.metrics.contractPassRate}%` : '0%',
        icon: ShieldAlert,
        color: 'teal',
      },
    ],
    [dashboard]
  );

  return (
    <Box p="lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={2} style={{ color: 'white', fontWeight: 600 }}>Dashboard</Title>
            <Text c="dimmed" size="sm">Live overview from your saved schemas and generated mock endpoints.</Text>
          </div>
          <Group>
            <Button variant="default" component={Link} to="/app/schemas" leftSection={<Activity size={16} />}>
              Open Schema Designer
            </Button>
            <Button color="indigo" component={Link} to="/app/schemas" leftSection={<Plus size={16} />}>
              New Schema
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert color="red" mb="lg" title="Unable to load dashboard">
            {error}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
          {metrics.map((metric) => (
            <motion.div key={metric.title} whileHover={{ y: -4 }}>
              <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <Group justify="space-between" mb="sm">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>{metric.title}</Text>
                  <metric.icon size={20} style={{ color: `var(--mantine-color-${metric.color}-5)`, opacity: 0.8 }} />
                </Group>
                <Group align="flex-end" gap="sm">
                  <Title order={1} style={{ fontSize: '2.5rem', color: 'white', lineHeight: 1 }}>
                    {loading ? <Loader size="sm" color="indigo" /> : metric.value}
                  </Title>
                </Group>
              </div>
            </motion.div>
          ))}
        </SimpleGrid>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <Group justify="space-between" mb="lg">
            <Title order={4} style={{ color: 'white' }}>Configured Mock Endpoints</Title>
            <Button variant="subtle" color="indigo" component={Link} to="/app/mocks">Manage</Button>
          </Group>

          <Table verticalSpacing="sm" style={{ color: 'var(--text-secondary)' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>METHOD</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>ENDPOINT</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>STATUS</Table.Th>
                <Table.Th style={{ color: 'var(--text-secondary)' }}>LATENCY</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dashboard?.endpoints.map((row) => (
                <Table.Tr key={row._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Table.Td>
                    <Badge color={methodColor(row.method)} variant="light">
                      {row.method}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ fontFamily: 'monospace', color: 'white' }}>{row.path}</Table.Td>
                  <Table.Td>
                    <Badge color={row.isActive ? 'teal' : 'gray'} variant="outline">
                      {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{row.latencyMs}ms</Table.Td>
                </Table.Tr>
              ))}
              {!loading && dashboard?.endpoints.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center" py="xl">
                      Save an OpenAPI schema to generate real mock endpoints.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
