import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Text, Card, Table } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TimeLogModal from '../components/TimeLogModal';
import type { Tables } from '../lib/supabase';

type Project = Tables['projects'];
type TimeLog = Tables['time_logs'];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTimeLogs();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectEmployees, error: projectEmployeesError } = await supabase
        .from('project_employees')
        .select('project_id')
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (projectEmployeesError) throw projectEmployeesError;

      const projectIds = projectEmployees?.map(pe => pe.project_id) || [];

      if (projectIds.length > 0) {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*, projects(name)')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeLogs(data || []);
    } catch (error) {
      console.error('Error fetching time logs:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Group position="apart" mb="xl">
        <Title order={1}>Employee Dashboard</Title>
        <Group>
          <Text>Welcome, {profile?.full_name}</Text>
          <Button onClick={handleSignOut} variant="light" color="red">
            Sign Out
          </Button>
        </Group>
      </Group>

      <Button
        onClick={() => setIsTimeLogModalOpen(true)}
        color="blue"
        mb="xl"
        disabled={projects.length === 0}
      >
        Log Time
      </Button>

      <Title order={2} mb="md">My Projects</Title>
      {projects.length === 0 ? (
        <Text color="dimmed">You haven't been assigned to any projects yet.</Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <Card key={project.id} shadow="sm" p="lg">
              <Title order={3}>{project.name}</Title>
              <Text color="dimmed" size="sm">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))}
        </div>
      )}

      <Title order={2} mb="md">Recent Time Logs</Title>
      {timeLogs.length === 0 ? (
        <Text color="dimmed">No time logs found.</Text>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Hours</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.date).toLocaleDateString()}</td>
                <td>{(log.projects as any)?.name}</td>
                <td>{log.hours}</td>
                <td>{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <TimeLogModal
        opened={isTimeLogModalOpen}
        onClose={() => setIsTimeLogModalOpen(false)}
        projects={projects}
        onSuccess={fetchTimeLogs}
      />
    </Container>
  );
} 