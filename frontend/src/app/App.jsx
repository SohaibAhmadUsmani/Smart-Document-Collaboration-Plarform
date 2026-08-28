import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';

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
        <div style={{ padding: 24, fontFamily: 'monospace', background: '#fef2f2', color: '#991b1b', minHeight: '100vh' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Something crashed:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8, color: '#666' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <div className="app-root min-h-screen">
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Default Route redirects to Editor for now until Dashboard is built */}
            <Route path="/" element={<Navigate to="/editor" replace />} />
            
            {/* Document Editor Module (Completed) */}
            <Route path="/editor" element={<EditorCanvas />} />
            
            {/* 
              ---------------------------------------------------------
              TEAM MEMBERS: Add your new module routes below this block
              ---------------------------------------------------------
            */}
            
            {/* <Route path="/auth/*" element={<AuthPages />} /> */}
            {/* <Route path="/workspaces/*" element={<WorkspacesDashboard />} /> */}
            {/* <Route path="/dashboard/*" element={<FilesDashboard />} /> */}

            {/* Fallback 404 Route */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
                <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                <p>This module's UI is not built yet or the route does not exist.</p>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;
