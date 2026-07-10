import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Groups from './pages/Groups';
import GroupAssignments from './pages/GroupAssignments';

/** Route table. Login is disabled for now; app pages are directly accessible. */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/assignments" element={<GroupAssignments />} />
      </Route>

      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
