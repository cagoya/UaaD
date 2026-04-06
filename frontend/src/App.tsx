import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import MerchantLayout from './layouts/MerchantLayout';
import PublicLayout from './layouts/PublicLayout';
import DashboardPage from './pages/Dashboard';
import ActivitiesPage from './pages/Activities';
import HomePage from './pages/Home';
import NotificationsPage from './pages/Notifications';
import ProfilePage from './pages/Profile';
import PublicActivitiesPage from './pages/PublicActivities';
import ActivityDetailPage from './pages/ActivityDetail';
import SettingsPage from './pages/Settings';
import MerchantDashboardPage from './pages/MerchantDashboard';
import MerchantActivitiesPage from './pages/MerchantActivities';
import MerchantActivityNewPage from './pages/MerchantActivityNew';
import MerchantActivityEditPage from './pages/MerchantActivityEdit';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="activities" element={<PublicActivitiesPage />} />
              <Route path="activity/:id" element={<ActivityDetailPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes Wrapper */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Nested Application Routes */}
              <Route path="overview" element={<DashboardPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<Navigate to="/app/overview" replace />} />
            </Route>

            <Route
              path="/merchant"
              element={
                <ProtectedRoute>
                  <MerchantLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<MerchantDashboardPage />} />
              <Route path="activities" element={<MerchantActivitiesPage />} />
              <Route path="activities/new" element={<MerchantActivityNewPage />} />
              <Route path="activities/:id/edit" element={<MerchantActivityEditPage />} />
              <Route index element={<Navigate to="/merchant/dashboard" replace />} />
            </Route>

            {/* Legacy Fallbacks */}
            <Route path="/dashboard" element={<Navigate to="/app/overview" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
