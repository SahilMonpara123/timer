import { TextInput, PasswordInput, Button, Container, Title, Paper, Box, Loader, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile?.role) {
      const redirectPath = profile.role === 'manager' ? '/manager' : '/employee';
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate]);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 1 ? 'Password is required' : null),
    },
  });

  const handleLogin = async (values: typeof form.values) => {
    try {
      setLoading(true);

      // Step 1: Sign in and get user profile
      const { profile: userProfile } = await signIn(values.email, values.password);

      // Step 2: Show success message
      showNotification({
        title: 'Welcome back!',
        message: 'Successfully logged in',
        color: 'green',
      });

      // Step 3: Navigate based on role
      const redirectPath = userProfile.role === 'manager' ? '/manager' : '/employee';
      navigate(redirectPath, { replace: true });

    } catch (error) {
      console.error('Login error:', error);
      let message = 'Failed to sign in';
      
      if (error instanceof Error) {
        message = error.message;
        // Handle Supabase specific errors
        if (message.includes('Invalid login credentials')) {
          message = 'Invalid email or password';
        }
      }
      
      showNotification({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box bg="gray.1" h="100vh" pt={50}>
      <Container size="xs">
        <Paper shadow="md" p={30} radius="md" bg="white">
          <Title order={2} ta="center" mb="xl">
            Welcome Back
          </Title>

          <form onSubmit={form.onSubmit(handleLogin)}>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              type="email"
              required
              mb="md"
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mb="xl"
              {...form.getInputProps('password')}
            />

            <Button 
              fullWidth 
              type="submit"
              loading={loading}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 