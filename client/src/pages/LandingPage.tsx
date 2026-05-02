import { Box, Button, Container, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg-color)', overflow: 'hidden' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Group gap="sm">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="white" />
          </div>
          <Text fw={700} size="xl" style={{ color: 'white' }}>MockVault</Text>
        </Group>
        <Group>
          <Button variant="subtle" color="gray" component={Link} to="/login">Sign In</Button>
          <Button color="indigo" component={Link} to="/login">Get Started</Button>
        </Group>
      </header>

      <Container size="lg" pt={100} pb={80}>
        <Box ta="center" mb={60} style={{ position: 'relative' }}>
          <Title order={1} style={{ fontSize: '4rem', color: 'white', lineHeight: 1.1, marginBottom: '24px', zIndex: 1, position: 'relative' }}>
            Build APIs <span className="text-gradient">Before They Exist.</span>
          </Title>
          <Text size="xl" c="dimmed" style={{ maxWidth: '600px', margin: '0 auto', zIndex: 1, position: 'relative' }}>
            Design, mock, validate, and share API contracts from one persisted backend workflow.
          </Text>
          <Group justify="center" mt={40} style={{ zIndex: 1, position: 'relative' }}>
            <Button size="xl" color="indigo" component={Link} to="/login">Start Building</Button>
            <Button size="xl" variant="default" bg="transparent" c="white" component={Link} to="/login">Open Workspace</Button>
          </Group>
        </Box>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={100}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Zap size={24} color="#818CF8" />
            </div>
            <Title order={3} style={{ color: 'white' }} mb="sm">OpenAPI Native</Title>
            <Text c="dimmed">Save OpenAPI JSON and generate endpoint records directly from the contract.</Text>
          </div>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Database size={24} color="#818CF8" />
            </div>
            <Title order={3} style={{ color: 'white' }} mb="sm">Dynamic Mocking</Title>
            <Text c="dimmed">Serve responses generated from the response schemas stored in MongoDB.</Text>
          </div>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <ShieldCheck size={24} color="#818CF8" />
            </div>
            <Title order={3} style={{ color: 'white' }} mb="sm">Contract Testing</Title>
            <Text c="dimmed">Validate generated mock responses against saved schema contracts before they drift.</Text>
          </div>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default LandingPage;
