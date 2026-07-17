import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.context';
import LoadingSpinner from '../ui/LoadingSpinner';
import UnauthorizedPage from '../pages/UnauthorizedPage';

export default function RoleRoute({ allowedRoles }) {
  const { isAuthenticated, loading, roleName } = useAuth();

  if (loading) return <LoadingSpinner message="Đang kiểm tra quyền truy cập..." />;
  if (!isAuthenticated) return <UnauthorizedPage />;
  if (!roleName || !allowedRoles.includes(roleName)) return <UnauthorizedPage />;

  return <Outlet />;
}

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};