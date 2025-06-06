import { TextInput, PasswordInput, Button, Container, Title, Paper, Box, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
    },
    validate: {
      fullName: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Passwords do not match' : null,
      role: (value) => (!value ? 'Please select a role' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await signUp(values.email, values.password, values.fullName, values.role as 'manager' | 'employee');
      
      showNotification({
        title: 'Success',
        message: 'Account created. A confirmation email has been sent to your email.',
        color: 'green',
      });

      form.reset();
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.1" h="100vh" pt={50}>
      <Container size="xs">
        <Paper shadow="md" p={30} radius="md" bg="white">
          <Title order={2} ta="center" mb="xl">
            Create Account
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              mb="md"
              {...form.getInputProps('fullName')}
            />

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
              placeholder="Create a password"
              required
              mb="md"
              {...form.getInputProps('password')}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              mb="md"
              {...form.getInputProps('confirmPassword')}
            />

            <Select
              label="Role"
              placeholder="Select your role"
              data={[
                { value: 'employee', label: 'Employee' },
                { value: 'manager', label: 'Manager' },
              ]}
              required
              mb="xl"
              {...form.getInputProps('role')}
            />

            <Button 
              fullWidth 
              type="submit"
              loading={loading}
            >
              Sign Up
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 