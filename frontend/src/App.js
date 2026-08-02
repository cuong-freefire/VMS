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
import EventListPage from "./components/pages/EventListPage";
import EventDetailPage from "./components/pages/EventDetailPage";
import ApplyEventPage from "./components/pages/ApplyEventPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import AboutPage from "./components/pages/AboutPage";
import PlaceholderPage from "./components/pages/PlaceholderPage";
import UserListPage from "./components/pages/admin/UserListPage";
import UserDetailPage from "./components/pages/admin/UserDetailPage";
import AddUserPage from "./components/pages/admin/AddUserPage";
import EditUserPage from "./components/pages/admin/EditUserPage";
import CategoryListPage from "./components/pages/admin/CategoryListPage";
import AddCategoryPage from "./components/pages/admin/AddCategoryPage";
import EditCategoryPage from "./components/pages/admin/EditCategoryPage";
import SkillListPage from "./components/pages/admin/SkillListPage";
import AddSkillPage from "./components/pages/admin/AddSkillPage";
import EditSkillPage from "./components/pages/admin/EditSkillPage";
import StaffEventListPage from "./components/pages/staff/StaffEventListPage";
import StaffEventDetailPage from "./components/pages/staff/StaffEventDetailPage";
import CreateEventPage from "./components/pages/staff/CreateEventPage";
import EditEventPage from "./components/pages/staff/EditEventPage";
import ApplicationListPage from "./components/pages/staff/ApplicationListPage";
import ApplicationDetailPage from "./components/pages/staff/ApplicationDetailPage";
import ManagerEventListPage from "./components/pages/manager/ManagerEventListPage";
import ManagerEventDetailPage from "./components/pages/manager/ManagerEventDetailPage";

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
              <Route path="/volunteer/events" element={<EventListPage />} />
              <Route path="/volunteer/events/:id" element={<EventDetailPage />} />
              <Route path="/volunteer/events/:id/apply" element={<ApplyEventPage />} />
              <Route path="/volunteer/certificates" element={<PlaceholderPage title="Chứng nhận" member="NamLD (Member 2)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: STAFF routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
              <Route path="/staff/events" element={<StaffEventListPage />} />
              <Route path="/staff/events/:id" element={<StaffEventDetailPage />} />
              <Route path="/staff/events/add" element={<CreateEventPage />} />
              <Route path="/staff/events/:id/edit" element={<EditEventPage />} />
              <Route path="/staff/events/:eventId/applications" element={<ApplicationListPage />} />
              <Route path="/staff/events/:eventId/applications/:applicationId" element={<ApplicationDetailPage />} />
              <Route path="/staff/attendance" element={<PlaceholderPage title="Điểm danh" member="TienTD (Member 3)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: MANAGER routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER]} />}>
              <Route path="/manager/events" element={<ManagerEventListPage />} />
              <Route path="/manager/events/:id" element={<ManagerEventDetailPage />} />
              <Route path="/manager/dashboard" element={<PlaceholderPage title="Dashboard (Manager)" member="DucNM (Member 5)" />} />
            </Route>
          </Route>
        </Route>

        {/* Protected: ADMIN routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<PlaceholderPage title="Dashboard (Admin)" member="AnhND (Member 4)" />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/users/add" element={<AddUserPage />} />
              <Route path="/admin/users/:id" element={<UserDetailPage />} />
              <Route path="/admin/users/:id/edit" element={<EditUserPage />} />
              <Route path="/admin/categories" element={<CategoryListPage />} />
              <Route path="/admin/categories/add" element={<AddCategoryPage />} />
              <Route path="/admin/categories/:id/edit" element={<EditCategoryPage />} />
              <Route path="/admin/skills" element={<SkillListPage />} />
              <Route path="/admin/skills/add" element={<AddSkillPage />} />
              <Route path="/admin/skills/:id/edit" element={<EditSkillPage />} />
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