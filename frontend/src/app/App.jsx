import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';
import SignUpPage from '../modules/auth/pages/SignUpPage.jsx';
import LoginPage from '../modules/auth/pages/LoginPage.jsx';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-root min-h-screen">
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<EditorCanvas />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;