import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, Select, Text, TextInput, Title } from '@mantine/core';
import { Editor } from '@monaco-editor/react';
import { api, type SchemaDefinition } from '../lib/api';

const STARTER_OPENAPI_SPEC = JSON.stringify(
  {
    openapi: '3.0.3',
    info: {
      title: 'New API',
      version: '1.0.0',
    },
    paths: {
      '/health': {
        get: {
          summary: 'Read service health',
          responses: {
            '200': {
              description: 'Service health response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok'] },
                      checkedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['status', 'checkedAt'],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2
);

const SchemaDesigner = () => {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [name, setName] = useState('New API');
  const [version, setVersion] = useState('1.0.0');
  const [changeNote, setChangeNote] = useState('Updated schema');
  const [openapiSpec, setOpenapiSpec] = useState(STARTER_OPENAPI_SPEC);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSchemas()
      .then((loadedSchemas) => {
        setSchemas(loadedSchemas);
        if (loadedSchemas[0]) {
          setSelectedSchemaId(loadedSchemas[0]._id);
          setName(loadedSchemas[0].name);
          setVersion(loadedSchemas[0].version);
          setOpenapiSpec(loadedSchemas[0].openapiSpec);
        }
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  const schemaOptions = useMemo(
    () => schemas.map((schema) => ({ value: schema._id, label: `${schema.name} (${schema.version})` })),
    [schemas]
  );

  const selectSchema = (schemaId: string | null) => {
    setSelectedSchemaId(schemaId);
    const schema = schemas.find((candidate) => candidate._id === schemaId);
    if (!schema) return;

    setName(schema.name);
    setVersion(schema.version);
    setOpenapiSpec(schema.openapiSpec);
    setStatus(null);
    setError(null);
  };

  const startNewSchema = () => {
    setSelectedSchemaId(null);
    setName('New API');
    setVersion('1.0.0');
    setOpenapiSpec(STARTER_OPENAPI_SPEC);
    setStatus(null);
    setError(null);
  };

  const saveSchema = async () => {
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const result = await api.saveSchema({ name, version, openapiSpec, changeNote }, selectedSchemaId ?? undefined);
      setSelectedSchemaId(result.schema._id);
      setName(result.schema.name);
      setVersion(result.schema.version);
      setOpenapiSpec(result.schema.openapiSpec);
      setSchemas((current) => {
        const withoutSaved = current.filter((schema) => schema._id !== result.schema._id);
        return [result.schema, ...withoutSaved];
      });
      setStatus(`${result.endpoints.length} endpoint${result.endpoints.length === 1 ? '' : 's'} synced from this schema.`);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p="lg" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={3} style={{ color: 'white' }}>Schema Designer</Title>
          <Text c="dimmed" size="sm">Persist OpenAPI JSON and generate mock endpoints from the saved contract.</Text>
        </div>
        <Group>
          <Button variant="default" onClick={startNewSchema}>New</Button>
          <Button color="indigo" loading={saving} onClick={saveSchema}>Save Schema</Button>
        </Group>
      </Group>

      <Group align="flex-end" mb="md" grow>
        <Select
          label="Saved schema"
          placeholder="No schema selected"
          data={schemaOptions}
          value={selectedSchemaId}
          onChange={selectSchema}
          clearable
        />
        <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <TextInput label="Version" value={version} onChange={(event) => setVersion(event.currentTarget.value)} />
        <TextInput label="Change Note" value={changeNote} onChange={(event) => setChangeNote(event.currentTarget.value)} />
      </Group>

      {error && (
        <Alert color="red" mb="md" title="Schema error">
          {error}
        </Alert>
      )}
      {status && (
        <Alert color="teal" mb="md" title="Schema saved">
          {status}
        </Alert>
      )}

      <Paper style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--border-color)' }} radius="md" bg="#1E1E1E">
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          value={openapiSpec}
          onChange={(value) => setOpenapiSpec(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            tabSize: 2,
          }}
        />
      </Paper>
    </Box>
  );
};

export default SchemaDesigner;
