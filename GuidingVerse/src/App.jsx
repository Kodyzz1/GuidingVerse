// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext'; // Correct import?
import './styles/index.css';

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