import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Title, Text, Button, Paper } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptInvite, user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    if (user) {
      handleAcceptInvite(token);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAcceptInvite = async (token: string) => {
    try {
      await acceptInvite(token);
      navigate('/employee');
    } catch (err) {
      setError('Failed to accept invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size={420} my={40}>
        <Text align="center">Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title
        align="center"
        sx={(theme) => ({ fontFamily: theme.fontFamily, fontWeight: 900 })}
      >
        Project Invitation
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error ? (
          <>
            <Text color="red" align="center" mb="md">
              {error}
            </Text>
            <Button
              fullWidth
              variant="light"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </>
        ) : !user ? (
          <>
            <Text align="center" mb="md">
              Please sign in or create an account to accept the invitation
            </Text>
            <Button
              fullWidth
              onClick={() => navigate('/login')}
              mb="md"
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="light"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </>
        ) : (
          <Text align="center">Processing your invitation...</Text>
        )}
      </Paper>
    </Container>
  );
} 