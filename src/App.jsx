import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import Candidates from './pages/Candidates.jsx';
import Settings from './pages/Settings.jsx';
import RoleDashboard from './pages/RoleDashboard.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { useTheme } from './hooks/useTheme.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import RootRedirect from './pages/RootRedirect.jsx';
import ProfileBuilder from './pages/ProfileBuilder.jsx';
import StudentJobs from './pages/StudentJobs.jsx';
import SkillAssessment from './pages/SkillAssessment.jsx';
import CredentialViewer from './pages/CredentialViewer.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import RecruiterJobPost from './pages/RecruiterJobPost.jsx';
import RecruiterApplicants from './pages/RecruiterApplicants.jsx';
import RecruiterInterviews from './pages/RecruiterInterviews.jsx';
import RecruiterAnalytics from './pages/RecruiterAnalytics.jsx';
import AdminRoles from './pages/AdminRoles.jsx';
import AdminInstitutions from './pages/AdminInstitutions.jsx';
import AdminAudit from './pages/AdminAudit.jsx';
import AdminApi from './pages/AdminApi.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';
import { PWAEnhancements } from './components/pwa/PWAEnhancements.jsx';
import { StudentDataProvider } from './context/StudentDataContext.jsx';

function Splash() {
  return (
    <div className="splash" aria-label="Loading application">
      <div className="logo">HL</div>
      <div className="app-name">HireLedger</div>
    </div>
  );
}

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  return (
    <BrowserRouter>
      <PWAEnhancements />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<Layout onToggleTheme={toggleTheme} theme={theme} />}> {/* layout wrapper with Outlet */}
          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
          <Route path="/dashboard/:role" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/dashboard" element={<ProtectedRoute roles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/new" element={<ProtectedRoute roles={['recruiter']}><RecruiterJobPost /></ProtectedRoute>} />
          <Route path="/recruiter/applicants" element={<ProtectedRoute roles={['recruiter']}><RecruiterApplicants /></ProtectedRoute>} />
          <Route path="/recruiter/interviews" element={<ProtectedRoute roles={['recruiter']}><RecruiterInterviews /></ProtectedRoute>} />
          <Route path="/recruiter/analytics" element={<ProtectedRoute roles={['recruiter']}><RecruiterAnalytics /></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute roles={['admin']}><AdminRoles /></ProtectedRoute>} />
          <Route path="/admin/institutions" element={<ProtectedRoute roles={['admin']}><AdminInstitutions /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AdminAudit /></ProtectedRoute>} />
          <Route path="/admin/api" element={<ProtectedRoute roles={['admin']}><AdminApi /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute roles={['recruiter','admin']}><Jobs /></ProtectedRoute>} />
          <Route path="/candidates" element={<ProtectedRoute roles={['recruiter','admin']}><Candidates /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile/builder" element={<ProtectedRoute roles={['student']}><ProfileBuilder /></ProtectedRoute>} />
          <Route path="/student/jobs" element={<ProtectedRoute roles={['student']}><StudentJobs /></ProtectedRoute>} />
          <Route path="/student/assessments" element={<ProtectedRoute roles={['student']}><SkillAssessment /></ProtectedRoute>} />
          <Route path="/student/credentials" element={<ProtectedRoute roles={['student']}><CredentialViewer /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SearchProvider>
          <StudentDataProvider>
            <Splash />
            <AppShell />
          </StudentDataProvider>
        </SearchProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

