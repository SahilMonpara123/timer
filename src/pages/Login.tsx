import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: '#f8f9fa'
    }}>
      <Container size={420}>
        <Title
          align="center"
          sx={(theme) => ({
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: theme.spacing.md,
          })}
        >
          Welcome back!
        </Title>
        <Text color="dimmed" size="sm" align="center" mb={30}>
          Don't have an account yet?{' '}
          <Link to="/signup" style={{ color: '#228be6', textDecoration: 'none' }}>
            Create account
          </Link>
        </Text>

        <Paper withBorder shadow="md" p={30} radius="md" bg="white">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              size="md"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              size="md"
              required
              mt="md"
              {...form.getInputProps('password')}
            />
            {error && (
              <Text color="red" size="sm" mt="sm">
                {error}
              </Text>
            )}
            <Button 
              fullWidth 
              mt="xl" 
              size="md"
              type="submit" 
              loading={loading}
            >
              Sign in
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 