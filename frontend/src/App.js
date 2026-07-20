import { Route, Routes } from "react-router-dom";
import { Bounce, ToastContainer } from 'react-toastify';

import GuestRoute from "./components/guards/GuestRoute";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import RoleRoute from "./components/guards/RoleRoute";
import MainLayout from "./components/layouts/MainLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ROLES } from "./constants/roles";

import LandingPage from "./components/pages/LandingPage";
import HomePage from "./components/pages/Homepage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/auth/RegisterPage";
import ForgotPasswordPage from "./components/pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./components/pages/auth/ChangePasswordPage";
import ProfileViewPage from "./components/pages/profile/ProfileViewPage";
import ProfileEditPage from "./components/pages/profile/ProfileEditPage";
import VolunteerHistoryPage from "./components/pages/profile/VolunteerHistoryPage";
import EventDetailPage from "./components/pages/EventDetailPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import AboutPage from "./components/pages/AboutPage";
import PlaceholderPage from "./components/pages/PlaceholderPage";

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

        {/* Public: Landing page with full layout */}
        <Route element={<MainLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Public: About page */}
        <Route element={<MainLayout />}>
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Protected: Shared routes — all authenticated roles */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/profile" element={<ProfileViewPage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        {/* Protected: VOLUNTEER routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.VOLUNTEER]} />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/history" element={<VolunteerHistoryPage />} />
              <Route path="/volunteer/events" element={<PlaceholderPage title="Danh sách Sự kiện" member="NamLD (Member 2)" />} />
              <Route path="/volunteer/events/:id" element={<EventDetailPage />} />
              <Route path="/volunteer/certificates" element={<PlaceholderPage title="Chứng nhận" member="NamLD (Member 2)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: STAFF routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
              <Route path="/staff/events" element={<PlaceholderPage title="Quản lý Sự kiện (Staff)" member="TienTD (Member 3)" />} />
              <Route path="/staff/applications" element={<PlaceholderPage title="Xét duyệt Đơn đăng ký" member="TienTD (Member 3)" />} />
              <Route path="/staff/attendance" element={<PlaceholderPage title="Điểm danh" member="TienTD (Member 3)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: MANAGER routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER]} />}>
              <Route path="/manager/dashboard" element={<PlaceholderPage title="Dashboard (Manager)" member="DucNM (Member 5)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: ADMIN routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<PlaceholderPage title="Dashboard (Admin)" member="AnhND (Member 4)" />} />
              <Route path="/admin/users" element={<PlaceholderPage title="Quản lý Người dùng" member="AnhND (Member 4)" />} />
              <Route path="/admin/categories" element={<PlaceholderPage title="Quản lý Danh mục" member="AnhND (Member 4)" />} />
              <Route path="/admin/skills" element={<PlaceholderPage title="Quản lý Kỹ năng" member="AnhND (Member 4)" />} />
            </Route>
          </Route>
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