import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Group, Progress, Table, Text, Title } from '@mantine/core';
import { Download, Play } from 'lucide-react';
import { api, type ContractReport } from '../lib/api';

const ContractTesting = () => {
  const [report, setReport] = useState<ContractReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      setReport(await api.getContractReport());
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api
      .getContractReport()
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const exportReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mockvault-contract-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={3} style={{ color: 'white' }}>Contract Testing</Title>
          <Text c="dimmed" size="sm">Validate generated mock responses against your saved OpenAPI schemas.</Text>
        </div>
        <Group>
          <Button variant="default" leftSection={<Download size={16} />} disabled={!report} onClick={exportReport}>
            Export Report
          </Button>
          <Button color="indigo" leftSection={<Play size={16} />} loading={loading} onClick={loadReport}>
            Run Test Suite
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="Contract report failed">
          {error}
        </Alert>
      )}

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={600} style={{ color: 'white' }}>Overall Health Score</Text>
          <Badge color={report?.failed ? 'red' : 'teal'} variant="light">
            {report ? `${report.passRate}% PASS RATE` : 'NO REPORT'}
          </Badge>
        </Group>
        <Progress value={report?.passRate ?? 0} color={report?.failed ? 'red' : 'teal'} size="xl" radius="xl" mb="md" />
        <Text size="sm" c="dimmed">
          {report
            ? `${report.passed} passing and ${report.failed} failing checks across ${report.total} configured endpoints.`
            : 'Run the suite after saving a schema.'}
        </Text>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <Title order={5} mb="lg" style={{ color: 'white' }}>Schema Validation Results</Title>
        <Table verticalSpacing="md" style={{ color: 'var(--text-secondary)' }}>
          <Table.Tbody>
            {report?.results.map((result) => (
              <Table.Tr key={result.endpointId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <Table.Td><Badge color="blue" variant="light">{result.method}</Badge></Table.Td>
                <Table.Td style={{ fontFamily: 'monospace', color: 'white' }}>{result.path}</Table.Td>
                <Table.Td>
                  <Badge color={result.status === 'PASS' ? 'teal' : 'red'} variant="outline" size="sm">
                    {result.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={result.status === 'PASS' ? 'dimmed' : 'red'}>{result.message}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {report?.results.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="xl">No endpoints are available to test yet.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Box>
  );
};

export default ContractTesting;
