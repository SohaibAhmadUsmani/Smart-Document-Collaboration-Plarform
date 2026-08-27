import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';
import DashboardPage from '../modules/files-dashboard/pages/DashboardPage.jsx';
import FileManagerPage from '../modules/files-dashboard/pages/FileManagerPage.jsx';

export function App() {
  return (
    <div className="app-root min-h-screen">
      <Routes>
        <Route path="/" element={<EditorCanvas />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/files" element={<FileManagerPage />} />
      </Routes>
    </div>
  );
}

export default App;