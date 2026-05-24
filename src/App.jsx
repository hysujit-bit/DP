import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import MemberProfile from './pages/MemberProfile';
import AddEditMember from './pages/AddEditMember';
import IshtabhritiTracker from './pages/IshtabhritiTracker';
import WorkPlanner from './pages/WorkPlanner';
import CreateDrive from './pages/CreateDrive';
import DriveDetail from './pages/DriveDetail';
import LogActivity from './pages/LogActivity';
import AdminPanel from './pages/AdminPanel';
import Definitions from './pages/Definitions';
import DPPortalStatus from './pages/DPPortalStatus';
import MySpace from './pages/MySpace';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly) {
    const isAdmin = user.role === 'super_admin' || user.role === 'suk_admin';
    if (!isAdmin) return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<MembersList />} />
        <Route path="members/new" element={<AddEditMember />} />
        <Route path="members/:id" element={<MemberProfile />} />
        <Route path="members/:id/edit" element={<AddEditMember />} />
        <Route path="ishtabhrity" element={<IshtabhritiTracker />} />
        <Route path="dp-work" element={<WorkPlanner />} />
        <Route path="dp-work/new" element={<CreateDrive />} />
        <Route path="dp-work/activity" element={<LogActivity />} />
        <Route path="dp-work/:id" element={<DriveDetail />} />
        <Route path="my-space" element={<MySpace />} />
        <Route path="dp-portal" element={<DPPortalStatus />} />
        <Route path="definitions" element={<Definitions />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
