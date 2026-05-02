import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Group,
  Select,
  Text,
  Title,
  Timeline,
} from '@mantine/core';
import { DiffEditor } from '@monaco-editor/react';
import { History, RotateCcw } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { api, type SchemaDefinition, type SchemaVersion } from '../lib/api';

const Versions = () => {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    api
      .getSchemas()
      .then((loadedSchemas) => {
        setSchemas(loadedSchemas);
        if (loadedSchemas[0]) {
          setSelectedSchemaId(loadedSchemas[0]._id);
        }
      })
      .catch((err) => notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSchemaId) {
      setLoading(true);
      api.getSchemaVersions(selectedSchemaId)
        .then((loadedVersions) => {
          setVersions(loadedVersions);
          if (loadedVersions.length > 0) {
            setSelectedVersionId(loadedVersions[0]._id);
          } else {
            setSelectedVersionId(null);
          }
        })
        .catch((err) => notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' }))
        .finally(() => setLoading(false));
    } else {
      setVersions([]);
      setSelectedVersionId(null);
    }
  }, [selectedSchemaId]);

  const handleRollback = async () => {
    if (!selectedSchemaId || !selectedVersionId) return;
    if (!confirm('Are you sure you want to rollback to this version?')) return;
    
    setRollingBack(true);
    try {
      await api.rollbackSchemaVersion(selectedSchemaId, selectedVersionId);
      notifications.show({ title: 'Success', message: 'Schema rolled back successfully', color: 'teal' });
      // Reload versions
      const loadedVersions = await api.getSchemaVersions(selectedSchemaId);
      setVersions(loadedVersions);
      if (loadedVersions.length > 0) {
        setSelectedVersionId(loadedVersions[0]._id);
      }
    } catch (err) {
      notifications.show({ title: 'Error', message: (err as Error).message, color: 'red' });
    } finally {
      setRollingBack(false);
    }
  };

  const selectedSchema = schemas.find((s) => s._id === selectedSchemaId);
  const selectedVersion = versions.find((v) => v._id === selectedVersionId);
  // Get previous version for diffing (if selected is index 0, compare with nothing or itself?)
  // Actually, we can just diff selectedVersion with current schema
  const currentSpec = selectedSchema?.openapiSpec || '';
  const selectedSpec = selectedVersion?.openapiSpec || '';

  return (
    <Box p="lg" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={3} style={{ color: 'white' }}>
            API Version Control
          </Title>
          <Text c="dimmed" size="sm">
            View history and rollback changes for your schemas.
          </Text>
        </div>
        <Button
          color="orange"
          leftSection={<RotateCcw size={16} />}
          disabled={!selectedVersionId || rollingBack}
          loading={rollingBack}
          onClick={handleRollback}
        >
          Rollback to Selected
        </Button>
      </Group>

      {schemas.length === 0 && !loading ? (
        <Alert color="blue" title="No schemas found">
          Create a schema first to see its version history.
        </Alert>
      ) : (
        <Group align="flex-start" style={{ flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <Box style={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Select
              label="Select Schema"
              data={schemas.map((s) => ({ value: s._id, label: s.name }))}
              value={selectedSchemaId}
              onChange={setSelectedSchemaId}
              mb="xl"
            />
            
            <Text fw={600} mb="md" style={{ color: 'white' }}>History</Text>
            <Box style={{ flex: 1, overflowY: 'auto' }}>
              <Timeline active={versions.findIndex(v => v._id === selectedVersionId)} bulletSize={24} lineWidth={2}>
                {versions.map((version, index) => (
                  <Timeline.Item
                    key={version._id}
                    title={`${version.version} - ${new Date(version.snapshotAt).toLocaleString()}`}
                    bullet={<History size={12} />}
                    lineVariant={index === versions.length - 1 ? 'dashed' : 'solid'}
                    onClick={() => setSelectedVersionId(version._id)}
                    style={{ cursor: 'pointer', paddingBottom: 16 }}
                  >
                    <Text c={selectedVersionId === version._id ? 'white' : 'dimmed'} size="sm">
                      {version.changeNote || 'Updated schema'}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Box>
          </Box>

          {/* Diff Editor */}
          <Box style={{ flex: 1, height: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <Box p="xs" bg="#25262B" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Text size="sm" fw={500} style={{ color: 'white' }}>
                Comparing: Selected Version (Left) vs Current Schema (Right)
              </Text>
            </Box>
            <DiffEditor
              height="calc(100% - 40px)"
              language="json"
              theme="vs-dark"
              original={selectedSpec}
              modified={currentSpec}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                renderSideBySide: true,
              }}
            />
          </Box>
        </Group>
      )}
    </Box>
  );
};

export default Versions;
