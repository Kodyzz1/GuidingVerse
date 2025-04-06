// --- Imports ---
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';

// --- Styles ---
import './styles/index.css';
import './styles/pages.css';

// --- Component Definition ---
function App() {
  return (
    <BrowserRouter> {/* BrowserRouter MUST be outermost */}
      <AuthProvider> {/* AuthProvider MUST wrap AppRoutes */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;