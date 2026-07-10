import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.context';
import { roleRouteMap } from '../../constants/roles';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function GuestRoute() {
  const { isAuthenticated, loading, roleName } = useAuth();
  if (loading) return <LoadingSpinner message="Dang kiem tra phien dang nhap..." />;
  if (isAuthenticated) {
    const target = roleName ? (roleRouteMap[roleName] || '/home') : '/home';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}