import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes'; // Import the routes definition
import './styles/index.css'; // Or your main CSS entry point

function App() {
  return (
    <BrowserRouter>
      {/* Potential Context Providers will wrap AppRoutes later */}
      {/* e.g., <AuthProvider><SettingsProvider> */}
      <AppRoutes />
      {/* </SettingsProvider></AuthProvider> */}
    </BrowserRouter>
  );
}

export default App;