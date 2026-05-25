// client/src/App.jsx
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/slices/authSlice';

import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import DashboardPage        from './pages/DashboardPage';
import AssignmentsPage      from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import GroupsPage           from './pages/GroupsPage';
import AnalyticsPage        from './pages/AnalyticsPage';
import LibraryPage          from './pages/LibraryPage';
import ToolkitPage          from './pages/ToolkitPage';
import SettingsPage         from './pages/SettingsPage';
import LandingPage          from './pages/LandingPage';

// ── Auth guard ────────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, token, initializing } = useSelector((s) => s.auth);
  const location = useLocation();

  if (initializing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        fontFamily: 'var(--font-sans)', color: 'var(--mid)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--brand)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>Loading Assessly...</span>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, initializing } = useSelector((s) => s.auth);
  if (initializing) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  // Restore session on mount
  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    } else {
      // No token — mark initializing=false so routes resolve
      dispatch({ type: 'auth/setInitializing', payload: false });
    }
  }, [dispatch, token]);

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 'var(--r-full)',
            padding: '10px 20px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        {/* <Route path="/"         element={<LandingPage />} /> */}
        <Route path="/"         element={<PublicRoute><DashboardPage /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/assignments" element={<PrivateRoute><AssignmentsPage /></PrivateRoute>} />
        <Route path="/assignments/:id/generating" element={<PrivateRoute><AssignmentDetailPage generating /></PrivateRoute>} />
        <Route path="/assignments/:id" element={<PrivateRoute><AssignmentDetailPage /></PrivateRoute>} />
        <Route path="/groups"    element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
        <Route path="/library"   element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
        <Route path="/toolkit"   element={<PrivateRoute><ToolkitPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

        {/* Default redirects */}
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

export default App;
