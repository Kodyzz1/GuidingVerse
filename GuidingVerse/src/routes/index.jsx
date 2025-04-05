import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layouts
import MainLayout from '../layouts/MainLayout';
// Import Pages
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import HowItWorksPage from '../pages/HowItWorksPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import NotFoundPage from '../pages/NotFoundPage';

// Import Feature Pages
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import BibleReaderPage from '../features/bibleReader/pages/BibleReaderPage';
import ProfilePage from '../features/profile/pages/ProfilePage';

// --- 1. Import ProtectedRoute ---
import ProtectedRoute from './ProtectedRoute'; // Adjust path if necessary

function AppRoutes() {
  return (
    <Routes>
      {/* Routes using MainLayout */}
      {/* Wrap the parent Route's element OR wrap individual Route elements */}
      {/* Here we wrap individual Route elements */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* --- 2. Apply ProtectedRoute --- */}
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
        {/* --- End Protected Routes --- */}

        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        {/* Add other public routes that use MainLayout here */}
      </Route>

      {/* Routes without MainLayout (Auth pages) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;