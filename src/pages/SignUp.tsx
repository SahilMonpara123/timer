import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Select, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      fullName: '',
      role: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      fullName: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      role: (value) => (!value ? 'Please select a role' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      setLoading(true);

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create profile entry
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: values.email,
            full_name: values.fullName,
            role: values.role as 'manager' | 'employee',
          });

        if (profileError) throw profileError;
      }

      // Redirect to login page after successful signup
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Please try again.');
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
          Create an account
        </Title>
        <Text color="dimmed" size="sm" align="center" mb={30}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#228be6', textDecoration: 'none' }}>
            Sign in
          </Link>
        </Text>

        <Paper withBorder shadow="md" p={30} radius="md" bg="white">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              size="md"
              required
              {...form.getInputProps('fullName')}
            />
            <TextInput
              label="Email"
              placeholder="Enter your email"
              size="md"
              required
              mt="md"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Password"
              placeholder="Create a password"
              size="md"
              required
              mt="md"
              {...form.getInputProps('password')}
            />
            <Select
              label="Role"
              placeholder="Select your role"
              size="md"
              data={[
                { value: 'manager', label: 'Manager' },
                { value: 'employee', label: 'Employee' },
              ]}
              required
              mt="md"
              {...form.getInputProps('role')}
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
              Create account
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 