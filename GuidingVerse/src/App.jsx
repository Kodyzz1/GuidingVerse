// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';

// Import styles
import './styles/index.css';  // Base styles
import './styles/pages.css';  // Static pages styles

function App() {
  return (
    <BrowserRouter> {/* BrowserRouter MUST be outermost */}
      <AuthProvider> {/* AuthProvider MUST wrap AppRoutes */}
        <AppRoutes /> {/* Your routes component */}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;