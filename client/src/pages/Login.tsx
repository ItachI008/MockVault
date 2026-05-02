import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Divider, Group, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { Database } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveAuthSession, type AuthMode } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot_password' | 'reset_password'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'verify') {
        const auth = await api.verifyOtp({ email, otp });
        if (auth.token && auth.user) {
          saveAuthSession(auth);
          if (auth.user.isOnboarded) {
            navigate('/app');
          } else {
            navigate('/onboarding');
          }
        }
      } else if (mode === 'forgot_password') {
        const res = await api.forgotPassword(email);
        setSuccess(res.message);
        setMode('reset_password');
      } else if (mode === 'reset_password') {
        const res = await api.resetPassword({ email, otp, newPassword: password });
        setSuccess(res.message);
        setMode('login');
        setPassword('');
        setOtp('');
      } else {
        const auth = await api.authenticate(mode as AuthMode, { fullName, email, password });
        if (auth.requiresVerification) {
          setMode('verify');
          setError(null);
          return;
        }
        
        if (auth.token && auth.user) {
          saveAuthSession(auth);
          if (auth.user.isOnboarded) {
            navigate('/app');
          } else {
            navigate('/onboarding');
          }
        }
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-color)' }}>
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <Link to="/" style={{ textDecoration: 'none', marginBottom: 'auto' }}>
          <Group gap="sm">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="white" />
            </div>
            <Text fw={700} size="xl" style={{ color: 'white' }}>MockVault</Text>
          </Group>
        </Link>

        <Box style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
          <Title order={2} style={{ color: 'white', marginBottom: '8px' }}>
            {mode === 'register' && 'Create your workspace'}
            {mode === 'login' && 'Sign in to your workspace'}
            {mode === 'verify' && 'Verify your email'}
            {mode === 'forgot_password' && 'Reset Password'}
            {mode === 'reset_password' && 'Enter Reset Code'}
          </Title>
          <Text c="dimmed" mb="xl">
            {mode === 'verify' && `We sent a 6-digit code to ${email}.`}
            {mode === 'forgot_password' && 'Enter your email to receive a reset code.'}
            {mode === 'reset_password' && `We sent a reset code to ${email}.`}
            {(mode === 'login' || mode === 'register') && 'Use your account to manage schemas, mocks, and contract reports.'}
          </Text>

          <Divider 
            label={mode === 'register' ? 'CREATE ACCOUNT' : mode === 'login' ? 'WELCOME BACK' : mode === 'forgot_password' ? 'FORGOT PASSWORD' : 'ENTER CODE'} 
            labelPosition="center" 
            mb="xl" 
          />

          {error && (
            <Alert color="red" mb="md" title="Error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="teal" mb="md" title="Success">
              {success}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            {mode === 'verify' || mode === 'reset_password' ? (
              <>
                <TextInput
                  label="Verification Code"
                  placeholder="123456"
                  value={otp}
                  onChange={(event) => setOtp(event.currentTarget.value)}
                  mb={mode === 'reset_password' ? 'md' : 'xl'}
                  required
                  maxLength={6}
                  styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white', letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }, label: { color: 'var(--text-secondary)' } }}
                />
                {mode === 'reset_password' && (
                  <PasswordInput
                    label="New Password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    mb="xl"
                    required
                    styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' }, label: { color: 'var(--text-secondary)' } }}
                  />
                )}
              </>
            ) : mode === 'forgot_password' ? (
              <TextInput
                label="Work Email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                mb="xl"
                required
                type="email"
                styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' }, label: { color: 'var(--text-secondary)' } }}
              />
            ) : (
              <>
                {mode === 'register' && (
                  <TextInput
                    label="Full Name"
                    value={fullName}
                    onChange={(event) => setFullName(event.currentTarget.value)}
                    mb="md"
                    required
                    styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' }, label: { color: 'var(--text-secondary)' } }}
                  />
                )}
                <TextInput
                  label="Work Email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  mb="md"
                  required
                  type="email"
                  styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' }, label: { color: 'var(--text-secondary)' } }}
                />
                <Box mb="xl">
                  <Group justify="space-between" mb={5}>
                    <Text component="label" size="sm" fw={500} style={{ color: 'var(--text-secondary)' }}>Password</Text>
                    {mode === 'login' && (
                      <Text
                        component="button"
                        type="button"
                        size="xs"
                        c="indigo"
                        onClick={() => setMode('forgot_password')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Forgot password?
                      </Text>
                    )}
                  </Group>
                  <PasswordInput
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                    styles={{ input: { background: '#1A1B1E', borderColor: 'var(--border-color)', color: 'white' } }}
                  />
                </Box>
              </>
            )}
            <Button fullWidth color="indigo" size="md" type="submit" loading={loading}>
              {mode === 'register' ? 'Create Account' : mode === 'login' ? 'Sign In' : mode === 'forgot_password' ? 'Send Reset Link' : mode === 'reset_password' ? 'Reset Password' : 'Verify Email'}
            </Button>
          </form>

          <Text ta="center" mt="xl" size="sm" c="dimmed">
            {mode === 'verify' || mode === 'forgot_password' || mode === 'reset_password' ? (
              <Button variant="subtle" size="compact-sm" onClick={() => setMode('login')}>
                Back to sign in
              </Button>
            ) : (
              <>
                {mode === 'register' ? 'Already have an account?' : 'Need an account?'}{' '}
                <Button variant="subtle" size="compact-sm" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
                  {mode === 'register' ? 'Sign in' : 'Create one'}
                </Button>
              </>
            )}
          </Text>
        </Box>
        <Box mt="auto" />
      </Box>

      <Box style={{ flex: 1, background: '#0F111A', borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <Title order={1} style={{ color: 'white', marginBottom: '24px' }}>MockVault</Title>
          <Text size="xl" c="dimmed" mb="xl">Connect schema design, mock serving, and contract checks through the same backend data.</Text>

          <div className="glass-panel" style={{ padding: '24px', background: '#1E1E1E', fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
            </div>
            <pre style={{ margin: 0, color: '#A5B4FC', whiteSpace: 'pre-wrap' }}>
{`GET /api/dashboard
GET /api/schemas
GET /api/mocks/live/{path}
GET /api/contracts/report`}
            </pre>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default Login;
