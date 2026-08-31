import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';
import { workspaceRoutes } from '../modules/workspaces/routes';
import { ToastProvider } from '../components/Toast';
import DashboardPage from '../modules/files-dashboard/pages/DashboardPage.jsx';
import FileManagerPage from '../modules/files-dashboard/pages/FileManagerPage.jsx';

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
            <Route path="/" element={<Navigate to="/workspaces" replace />} />
            {workspaceRoutes}
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
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;