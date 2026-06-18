import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './features/auth/AuthPage';
import CompanyPage from './pages/CompanyPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/worker/dashboard" element={<ProtectedRoute allowedRole="worker"><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/employer/dashboard" element={<ProtectedRoute allowedRole="employer"><EmployerDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/employer/:id" element={<CompanyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
