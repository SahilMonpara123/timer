import { Modal, TextInput, Button, Select, Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tables } from '../lib/supabase';

type Project = Tables['projects']['Row'];

interface TimeLogModalProps {
  opened: boolean;
  onClose: () => void;
  projects: Project[];
  onSuccess?: () => void;
}

export default function TimeLogModal({ opened, onClose, projects, onSuccess }: TimeLogModalProps) {
  const { user } = useAuth();

  const form = useForm({
    initialValues: {
      projectId: '',
      hours: '',
      notes: '',
      date: new Date(),
    },
    validate: {
      projectId: (value) => (!value ? 'Please select a project' : null),
      hours: (value) => {
        const hours = parseFloat(value);
        if (isNaN(hours)) return 'Hours must be a number';
        if (hours <= 0) return 'Hours must be greater than 0';
        if (hours % 0.25 !== 0) return 'Hours must be in increments of 0.25';
        return null;
      },
      date: (value) => (!value ? 'Please select a date' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const { error } = await supabase.from('time_logs').insert({
        project_id: values.projectId,
        user_id: user?.id,
        hours: parseFloat(values.hours),
        notes: values.notes,
        date: values.date.toISOString().split('T')[0],
      });

      if (error) throw error;

      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error logging time:', error);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Log Time">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Select
          label="Project"
          placeholder="Select a project"
          data={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          required
          {...form.getInputProps('projectId')}
        />
        <TextInput
          label="Hours"
          placeholder="Enter hours (e.g., 1.25, 2.5)"
          description="Hours must be in increments of 0.25 (e.g., 1.25, 1.5, 1.75)"
          required
          mt="md"
          {...form.getInputProps('hours')}
        />
        <Textarea
          label="Notes"
          placeholder="Enter any notes about the work done"
          mt="md"
          {...form.getInputProps('notes')}
        />
        <DateInput
          label="Date"
          placeholder="Select date"
          required
          mt="md"
          maxDate={new Date()}
          {...form.getInputProps('date')}
        />
        <Button type="submit" fullWidth mt="xl">
          Log Time
        </Button>
      </form>
    </Modal>
  );
} 