import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import ErrorBoundary from './shared/components/ErrorBoundary';
import ProtectedRoute from './shared/components/ProtectedRoute';
import AppShell from './shared/components/AppShell';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import StudentDashboard from './features/student/DashboardPage';
import StudentProfilePage from './features/student/ProfilePage';
import ApplicationListPage from './features/student/ApplicationListPage';
import ApplicationFormPage from './features/student/ApplicationFormPage';
import ApplicationDetailPage from './features/student/ApplicationDetailPage';
import ApplicationStatusPage from './features/student/ApplicationStatusPage';
import ViewResultsPage from './features/student/ViewResultsPage';
import ContactPage from './features/student/ContactPage';
import OidbApplicationListPage from './features/admin-oidb/OidbApplicationListPage';
import OidbDetailPage from './features/admin-oidb/OidbDetailPage';
import YdyoQueuePage from './features/admin-ydyo/YdyoQueuePage';
import YdyoReviewPage from './features/admin-ydyo/YdyoReviewPage';
import YgkQueuePage from './features/admin-ygk/YgkQueuePage';
import YgkEvaluationPage from './features/admin-ygk/YgkEvaluationPage';
import IntibakSplitPage from './features/intibak/IntibakSplitPage';
import IntibakQueuePage from './features/intibak/IntibakQueuePage';
import DeanQueuePage from './features/admin-dean/DeanQueuePage';
import DeanApprovalPage from './features/admin-dean/DeanApprovalPage';
import YgkPlacementPage from './features/admin-ygk/YgkPlacementPage';
import YgkDeptConditionsPage from './features/admin-ygk/YgkDeptConditionsPage';
import OidbResultsPage from './features/admin-oidb/OidbResultsPage';
import OidbSecondaryReviewPage from './features/admin-oidb/OidbSecondaryReviewPage';
import ToastContainer from './shared/components/ToastContainer';

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<div style={{ padding: '2rem', color: '#ef4444' }}>Access denied.</div>} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']} />}>
              <Route element={<AppShell />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/applications" element={<ApplicationListPage />} />
                <Route path="/student/applications/new" element={<ApplicationFormPage />} />
                <Route path="/student/applications/:id" element={<ApplicationDetailPage />} />
                <Route path="/student/status" element={<ApplicationStatusPage />} />
                <Route path="/student/results" element={<ViewResultsPage />} />
                <Route path="/student/contact" element={<ContactPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_OIDB', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/oidb/applications" element={<OidbApplicationListPage />} />
                <Route path="/admin/oidb/applications/:id" element={<OidbDetailPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_YDYO', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/ydyo/applications" element={<YdyoQueuePage />} />
                <Route path="/admin/ydyo/applications/:id" element={<YdyoReviewPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_YGK', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/ygk/applications" element={<YgkQueuePage />} />
                <Route path="/admin/ygk/applications/:id" element={<YgkEvaluationPage />} />
                <Route path="/admin/ygk/applications/:id/dept-conditions" element={<YgkDeptConditionsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_INTIBAK', 'ROLE_YGK', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/intibak/applications" element={<IntibakQueuePage />} />
                <Route path="/admin/intibak/applications/:id" element={<IntibakSplitPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_DEAN', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/dean/applications" element={<DeanQueuePage />} />
                <Route path="/admin/dean/applications/:id" element={<DeanApprovalPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_YGK', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/ygk/placement" element={<YgkPlacementPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ROLE_OIDB', 'ROLE_ADMIN']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/oidb/results" element={<OidbResultsPage />} />
                <Route path="/admin/oidb/secondary-review" element={<OidbSecondaryReviewPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
}
