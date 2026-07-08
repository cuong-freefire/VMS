import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.context';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Dang kiem tra phien dang nhap..." />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <Outlet />;
}
