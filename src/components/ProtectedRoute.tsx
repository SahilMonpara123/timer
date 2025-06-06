import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Center, Loader, Text } from '@mantine/core';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'employee';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading, error } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Text color="red" size="lg">{error}</Text>
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && (!profile?.role || profile.role !== requiredRole)) {
    // If user's role doesn't match the required role, redirect to their appropriate dashboard
    const redirectPath = profile?.role === 'manager' ? '/manager' : '/employee';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
} 