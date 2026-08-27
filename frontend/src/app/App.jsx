import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { EditorCanvas } from '../modules/editor/index.js';
import { workspaceRoutes } from '../modules/workspaces/routes';
import { ToastProvider } from '../components/Toast';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route */}
          <Route
            path="/"
            element={<Navigate to="/workspaces" replace />}
          />

          {/* Workspaces module */}
          {workspaceRoutes}

          {/* Document editor */}
          <Route
            path="/editor"
            element={
              <div className="app-root min-h-screen">
                <EditorCanvas />
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;