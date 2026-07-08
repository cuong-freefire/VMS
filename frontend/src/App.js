import { Route, Routes } from "react-router-dom";
import { Bounce, ToastContainer } from 'react-toastify';

import GuestRoute from "./components/guards/GuestRoute";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import MainLayout from "./components/layouts/MainLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";

import LandingPage from "./components/pages/LandingPage";
import HomePage from "./components/pages/Homepage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/auth/RegisterPage";
import ForgotPasswordPage from "./components/pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./components/pages/auth/ChangePasswordPage";
import ProfileViewPage from "./components/pages/profile/ProfileViewPage";
import ProfileEditPage from "./components/pages/profile/ProfileEditPage";
import VolunteerHistoryPage from "./components/pages/profile/VolunteerHistoryPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import AboutPage from "./components/pages/AboutPage";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth pages - centered card, no navbar/footer */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* Public landing with full layout */}
        <Route element={<MainLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Protected pages with full layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<ProfileViewPage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/history" element={<VolunteerHistoryPage />} />
          </Route>
        </Route>

        {/* Public: About page */}
        <Route element={<MainLayout />}>
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* 404 */}
        <Route element={<MainLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" transition={Bounce} />
    </ErrorBoundary>
  );
}

export default App;
