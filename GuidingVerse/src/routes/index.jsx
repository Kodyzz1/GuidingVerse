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

function AppRoutes() {
  return (
    <Routes>
      {/* Routes using MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/reader" element={<BibleReaderPage />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Adjust protection later */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        {/* Add other routes that use MainLayout here */}
      </Route>

      {/* Routes without MainLayout (e.g., Auth pages might use AuthLayout later) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;