import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Box, Button, Group, Paper, Select, SimpleGrid, Slider, Switch, Text, Title } from '@mantine/core';
import { Editor } from '@monaco-editor/react';
import { RefreshCcw, Activity } from 'lucide-react';
import { io } from 'socket.io-client';
import { api, resolvePreviewPath, type AuthRequirement, type MockEndpoint } from '../lib/api';

const authOptions: AuthRequirement[] = ['None', 'Bearer', 'API Key'];

const MockServer = () => {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [preview, setPreview] = useState('{}');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<Array<{
    method: string;
    path: string;
    statusCode: number;
    latencyMs: number;
    timestamp: string;
    error: boolean;
  }>>([]);

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint._id === selectedEndpointId) ?? null,
    [endpoints, selectedEndpointId]
  );

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const socket = io(socketUrl);
    
    socket.on('mock:hit', (log) => {
      setLogs((current) => [log, ...current].slice(0, 50)); // Keep last 50
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    api
      .getMocks()
      .then((loadedEndpoints) => {
        setEndpoints(loadedEndpoints);
        setSelectedEndpointId(loadedEndpoints[0]?._id ?? null);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  const refreshPreview = async (endpoint = selectedEndpoint) => {
    if (!endpoint) return;

    setLoadingPreview(true);
    setError(null);

    try {
      const response = await api.getMockPreview(endpoint);
      setPreview(JSON.stringify(response, null, 2));
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    const endpoint = endpoints.find((candidate) => candidate._id === selectedEndpointId);
    if (!endpoint) return;

    let active = true;

    api
      .getMockPreview(endpoint)
      .then((response) => {
        if (active) setPreview(JSON.stringify(response, null, 2));
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, [endpoints, selectedEndpointId]);

  const updateLocalEndpoint = (patch: Partial<Pick<MockEndpoint, 'latencyMs' | 'errorRate'>>) => {
    if (!selectedEndpoint) return;
    setEndpoints((current) =>
      current.map((endpoint) => (endpoint._id === selectedEndpoint._id ? { ...endpoint, ...patch } : endpoint))
    );
  };

  const updateSelectedEndpoint = async (
    patch: Partial<Pick<MockEndpoint, 'latencyMs' | 'errorRate' | 'isActive' | 'authRequired'>>
  ) => {
    if (!selectedEndpoint) return;

    try {
      const updated = await api.updateMock(selectedEndpoint._id, patch);
      setEndpoints((current) =>
        current.map((endpoint) =>
          endpoint._id === updated._id ? { ...endpoint, ...updated, schemaName: endpoint.schemaName } : endpoint
        )
      );
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const endpointOptions = endpoints.map((endpoint) => ({
    value: endpoint._id,
    label: `${endpoint.method} ${endpoint.path}`,
  }));

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={3} style={{ color: 'white' }}>Live Mock Server</Title>
          <Text c="dimmed" size="sm">Serve responses generated from your saved OpenAPI contracts.</Text>
        </div>
        <Badge color={endpoints.some((endpoint) => endpoint.isActive) ? 'green' : 'gray'} variant="light" size="lg">
          {endpoints.some((endpoint) => endpoint.isActive) ? 'SERVER ACTIVE' : 'NO ACTIVE ENDPOINTS'}
        </Badge>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="Mock server error">
          {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <Select
            label="Mock endpoint"
            placeholder="Save a schema to generate endpoints"
            data={endpointOptions}
            value={selectedEndpointId}
            onChange={setSelectedEndpointId}
            mb="lg"
          />

          {selectedEndpoint ? (
            <>
              <Group justify="space-between" mb="md">
                <Group>
                  <Badge color="blue" variant="light">{selectedEndpoint.method}</Badge>
                  <Text fw={600} style={{ color: 'white' }}>{selectedEndpoint.path}</Text>
                </Group>
                <Switch
                  checked={selectedEndpoint.isActive}
                  color="indigo"
                  onChange={(event) => updateSelectedEndpoint({ isActive: event.currentTarget.checked })}
                />
              </Group>

              <Text size="xs" fw={600} c="dimmed" mb="lg">
                Preview URL: /api/mocks/live{resolvePreviewPath(selectedEndpoint.path)}
              </Text>

              <Box mb="xl">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500} c="dimmed">LATENCY</Text>
                  <Text size="sm">{selectedEndpoint.latencyMs}ms</Text>
                </Group>
                <Slider
                  min={0}
                  max={2000}
                  value={selectedEndpoint.latencyMs}
                  color="indigo"
                  onChange={(value) => updateLocalEndpoint({ latencyMs: value })}
                  onChangeEnd={(value) => updateSelectedEndpoint({ latencyMs: value })}
                />
              </Box>

              <Box mb="xl">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500} c={selectedEndpoint.errorRate > 0 ? 'red' : 'dimmed'}>ERROR RATE</Text>
                  <Text size="sm">{selectedEndpoint.errorRate}%</Text>
                </Group>
                <Slider
                  min={0}
                  max={100}
                  value={selectedEndpoint.errorRate}
                  color="red"
                  onChange={(value) => updateLocalEndpoint({ errorRate: value })}
                  onChangeEnd={(value) => updateSelectedEndpoint({ errorRate: value })}
                />
              </Box>

              <Select
                label="Authentication requirement"
                data={authOptions}
                value={selectedEndpoint.authRequired}
                onChange={(value) => value && updateSelectedEndpoint({ authRequired: value as AuthRequirement })}
                mb="lg"
              />

              <Button
                variant="default"
                leftSection={<RefreshCcw size={16} />}
                loading={loadingPreview}
                onClick={() => refreshPreview()}
              >
                Refresh Preview
              </Button>
            </>
          ) : (
            <Text c="dimmed">No mock endpoints exist yet. Save an OpenAPI schema first.</Text>
          )}
        </div>

        <Paper style={{ overflow: 'hidden', border: '1px solid var(--border-color)', height: '420px' }} radius="md" bg="#1E1E1E">
          <Box p="sm" bg="#25262B" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <Text size="sm" fw={500} style={{ color: 'white' }}>Live Output Preview</Text>
          </Box>
          <Editor
            height="calc(100% - 40px)"
            language="json"
            theme="vs-dark"
            value={selectedEndpoint ? preview : '{}'}
            options={{ minimap: { enabled: false }, readOnly: true, fontSize: 13 }}
          />
        </Paper>
      </SimpleGrid>

      <Box mt="xl">
        <Group mb="md">
          <Activity size={20} color="#818CF8" />
          <Title order={4} style={{ color: 'white' }}>Real-time Traffic</Title>
        </Group>
        
        <Paper p="md" bg="#1E1E1E" style={{ border: '1px solid var(--border-color)' }}>
          {logs.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No traffic yet. Hit your mock endpoints to see live logs.</Text>
          ) : (
            <Box style={{ maxHeight: 300, overflowY: 'auto' }}>
              {logs.map((log, i) => (
                <Group key={i} justify="space-between" mb="sm" p="xs" style={{ background: '#25262B', borderRadius: 6 }}>
                  <Group>
                    <Badge color={log.error || log.statusCode >= 400 ? 'red' : 'green'} variant="light" w={60}>
                      {log.statusCode}
                    </Badge>
                    <Badge color="blue" variant="dot" w={60}>
                      {log.method}
                    </Badge>
                    <Text fw={500} size="sm" style={{ color: 'white' }}>{log.path}</Text>
                  </Group>
                  <Group>
                    <Text size="xs" c="dimmed">{log.latencyMs}ms</Text>
                    <Text size="xs" c="dimmed">{new Date(log.timestamp).toLocaleTimeString()}</Text>
                  </Group>
                </Group>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default MockServer;
