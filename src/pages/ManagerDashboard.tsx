import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Text, Card, Modal, TextInput, Select, Table, Loader, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { showNotification } from '@mantine/notifications';
import type { Tables } from '../lib/supabase';

type Project = Tables['projects']['Row'];
type Profile = Tables['profiles']['Row'];
type TimeLog = Tables['time_logs']['Row'];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { signOut, profile, user, inviteEmployee } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectForm = useForm({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Project name must be at least 2 characters' : null),
    },
  });

  const employeeForm = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify user session
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error('Failed to get user session');
        if (!currentUser) {
          navigate('/login', { replace: true });
          return;
        }

        // Verify user role
        if (!profile?.role || profile.role !== 'manager') {
          throw new Error('Unauthorized: Manager access required');
        }

        // Fetch initial data
        await Promise.all([fetchProjects(), fetchEmployees()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        showNotification({
          title: 'Error',
          message,
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, profile]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTimeLogs(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      if (!user?.id) throw new Error('User ID not found');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('manager_id', user.id);
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  };

  const fetchProjectTimeLogs = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*, profiles(full_name)')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeLogs(data || []);
    } catch (error) {
      console.error('Error fetching time logs:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to fetch time logs',
        color: 'red',
      });
    }
  };

  const handleCreateProject = async (values: typeof projectForm.values) => {
    try {
      if (!user?.id) throw new Error('User ID not found');

      const { error } = await supabase.from('projects').insert({
        name: values.name,
        manager_id: user.id,
      });

      if (error) throw error;

      projectForm.reset();
      setIsProjectModalOpen(false);
      await fetchProjects();
      
      showNotification({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create project',
        color: 'red',
      });
    }
  };

  const handleInviteEmployee = async (values: typeof employeeForm.values) => {
    if (!selectedProject) return;

    try {
      await inviteEmployee(values.email, selectedProject.id);
      employeeForm.reset();
      setIsEmployeeModalOpen(false);
      showNotification({
        title: 'Success',
        message: 'Invitation sent successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error inviting employee:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to send invitation',
        color: 'red',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to sign out',
        color: 'red',
      });
    }
  };

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
        <div>
          <Text color="red" size="lg" mb="md">{error}</Text>
          <Button onClick={handleSignOut}>Return to Login</Button>
        </div>
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group position="apart" mb="xl">
        <Title order={1}>Manager Dashboard</Title>
        <Group>
          <Text>Welcome, {profile?.full_name}</Text>
          <Button onClick={handleSignOut} variant="light" color="red">
            Sign Out
          </Button>
        </Group>
      </Group>

      <Button onClick={() => setIsProjectModalOpen(true)} color="blue" mb="xl">
        Create Project
      </Button>

      <Title order={2} mb="md">Projects</Title>
      {projects.length === 0 ? (
        <Text color="dimmed">No projects found. Create your first project to get started.</Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              shadow="sm" 
              p="lg"
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedProject(project)}
            >
              <Title order={3}>{project.name}</Title>
              <Text color="dimmed" size="sm">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </Text>
              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setIsEmployeeModalOpen(true);
                }}
              >
                Invite Employee
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <>
          <Title order={2} mb="md">Time Logs for {selectedProject.name}</Title>
          {timeLogs.length === 0 ? (
            <Text color="dimmed">No time logs found for this project.</Text>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {timeLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td>{(log.profiles as any)?.full_name}</td>
                    <td>{log.hours}</td>
                    <td>{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* Create Project Modal */}
      <Modal
        opened={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={projectForm.onSubmit(handleCreateProject)}>
          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            required
            {...projectForm.getInputProps('name')}
          />
          <Button type="submit" fullWidth mt="md">
            Create Project
          </Button>
        </form>
      </Modal>

      {/* Invite Employee Modal */}
      <Modal
        opened={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={`Invite Employee to ${selectedProject?.name}`}
      >
        <form onSubmit={employeeForm.onSubmit(handleInviteEmployee)}>
          <TextInput
            label="Employee Email"
            placeholder="Enter employee email"
            required
            {...employeeForm.getInputProps('email')}
          />
          <Button type="submit" fullWidth mt="md">
            Send Invitation
          </Button>
        </form>
      </Modal>
    </Container>
  );
} 