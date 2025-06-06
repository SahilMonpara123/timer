import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, AppShell } from '@mantine/core';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

export default function App() {
  return (
    <MantineProvider>
      <AppShell>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AppShell>
    </MantineProvider>
  );
}
