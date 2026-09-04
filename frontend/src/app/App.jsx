import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';
import { workspaceRoutes } from '../modules/workspaces/routes';
import { ToastProvider } from '../components/Toast';
import DashboardPage from '../modules/files-dashboard/pages/DashboardPage.jsx';
import FileManagerPage from '../modules/files-dashboard/pages/FileManagerPage.jsx';
import SignUpPage from '../modules/auth/pages/SignUpPage.jsx';
import LoginPage from '../modules/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage.jsx';

// Team members: Import your UI components here once your modules are complete!
// import { AuthPages } from '../modules/auth/index.js';
// import { WorkspacesDashboard } from '../modules/workspaces/index.js';
// import { FilesDashboard } from '../modules/files-dashboard/index.js';

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
        <div
          style={{
            padding: 24,
            fontFamily: 'monospace',
            background: '#fef2f2',
            color: '#991b1b',
            minHeight: '100vh',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Something crashed:
          </h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8, color: '#666' }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Navigate to="/editor" replace />} />
            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            {/* Workspaces / Dashboard */}
            {workspaceRoutes}
            {/* Document Editor */}
            <Route
              path="/editor"
              element={
                <div className="app-root min-h-screen">
                  <EditorCanvas />
                </div>
              }
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/files" element={<FileManagerPage />} />

            {/* Fallback 404 Route */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
                <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                <p>This module's UI is not built yet or the route does not exist.</p>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;