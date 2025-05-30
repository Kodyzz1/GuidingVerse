// --- Imports (Core & Router) ---
import { Routes, Route } from 'react-router-dom';

// --- Imports (Layouts) ---
import MainLayout from '../layouts/MainLayout';

// --- Imports (General Pages) ---
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import HowItWorksPage from '../pages/HowItWorksPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import NotFoundPage from '../pages/NotFoundPage';

// --- Imports (Feature Pages) ---
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import BibleReaderPage from '../features/bibleReader/pages/BibleReaderPage';
import ProfilePage from '../features/profile/pages/ProfilePage';

// --- Imports (Routing Helpers) ---
import ProtectedRoute from './ProtectedRoute';

// --- Component Definition (AppRoutes) ---
function AppRoutes() {
  return (
    <Routes>
      {/* Routes using MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Protected routes */}
        <Route
          path="/reader"
          element={
            <ProtectedRoute>
              <BibleReaderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Public routes */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        {/* <Route path="/search" element={<SearchResultsPage />} /> */}
      </Route>

      {/* Auth routes without MainLayout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;