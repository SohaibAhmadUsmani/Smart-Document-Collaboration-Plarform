/**
 * @file App.jsx
 * @description Main application routing, route guards, and provider orchestration for DocSync Pro.
 * DocSync Pro ka bunyadi routing, route guards, aur providers ka markazi component.
 */

import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
  useLocation,
  useSearchParams,
  Outlet,
} from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import { AuthProvider, useAuth } from '../modules/auth/context/AuthContext.jsx';
import { ProtectedRoute, PublicRoute } from '../modules/auth/context/AuthRoutes.jsx';
import { NotFoundPage } from '../components/NotFoundPage.jsx';
import { workspaceRoutes } from '../modules/workspaces/routes';
import DashboardPage from '../modules/files-dashboard/pages/DashboardPage.jsx';
import FileManagerPage from '../modules/files-dashboard/pages/FileManagerPage.jsx';
import SettingsPage from '../modules/settings/SettingsPage.jsx';
import SignUpPage from '../modules/auth/pages/SignUpPage.jsx';
import LoginPage from '../modules/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage.jsx';
import NotificationsPage from '../modules/notifications/pages/NotificationsPage.jsx';

const EditorCanvas = React.lazy(() =>
  import('../modules/editor/index.js').then((m) => ({ default: m.EditorCanvas }))
);

function EditorLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mb-3" />
      <p className="text-sm font-medium">Loading document editor...</p>
    </div>
  );
}

/**
 * EditorRouteWrapper extracts documentId and workspaceId from route and query parameters,
 * and renders the EditorCanvas.
 *
 * @returns {React.ReactElement}
 */
function EditorRouteWrapper() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const folderId = searchParams.get('folderId');

  return (
    <div className="app-root min-h-screen">
      <React.Suspense fallback={<EditorLoadingFallback />}>
        <EditorCanvas
          documentId={documentId || undefined}
          workspaceId={workspaceId || undefined}
          folderId={folderId || undefined}
        />
      </React.Suspense>
    </div>
  );
}

/**
 * Route guard for authenticated users.
 * Redirects unauthenticated users to /login preserving the attempted location in state.
 *
 * Authenticated sarfeen ke liye route guard.
 * Ghair-tasdeeq shuda sarfeen ko /login par redirect karta hai aur attempted location ko state mein mehfooz rakhta hai.
 *
 * @param {{ children?: React.ReactNode }} props - Component props / Component ke props.
 * @returns {React.ReactElement} Authenticated component or redirect / Tasdeeq shuda component ya redirect.
 */
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}


/**
 * ErrorBoundary catches render-time exceptions and provides an interface to reload.
 * Render-time ki kharabion ko pakadta hai aur application reload karne ka option deta hai.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 font-mono bg-red-50 text-red-900 min-h-screen flex flex-col items-start justify-center">
          <h2 className="text-xl font-bold mb-3">Something crashed:</h2>
          <pre className="whitespace-pre-wrap text-sm mb-4">{this.state.error.message}</pre>
          <pre className="whitespace-pre-wrap text-xs text-red-700/70 mb-6">{this.state.error.stack}</pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-sans font-medium"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * RootRedirect handles dynamic root navigation based on live auth state.
 */
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

/**
 * Root Application component providing routing, authentication boundaries, and toasts.
 * Bunyadi Application component jo routing, authentication boundaries, aur toasts faraham karta hai.
 *
 * @returns {React.ReactElement}
 */
export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Default route: Unauthenticated users land on login page first, authenticated users on dashboard */}
              {/* Pehla default safah: Ghair-tasdeeq shuda users login safah par jayenge, tasdeeq shuda users dashboard par */}
              <Route path="/" element={<RootRedirect />} />

              {/* Authentication */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignUpPage />
                  </PublicRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

              {/* Workspaces (Wrapped in PrivateRoute) */}
              <Route element={<ProtectedRoute />}>{workspaceRoutes}</Route>

              {/* Document Editor */}
              <Route
                path="/editor/:documentId?"
                element={
                  <ProtectedRoute>
                    <EditorRouteWrapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <FileManagerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              {/* Dedicated Notifications Inbox Page */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;