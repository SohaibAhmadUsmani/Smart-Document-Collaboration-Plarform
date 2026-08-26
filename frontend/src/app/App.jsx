import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EditorCanvas } from '../modules/editor/index.js';

export function App() {
  return (
    <div className="app-root min-h-screen">
      <Routes>
        <Route path="/" element={<EditorCanvas />} />
        {/* Other teammates and I will add more <Route> entries here as pages are ready */}
      </Routes>
    </div>
  );
}

export default App;