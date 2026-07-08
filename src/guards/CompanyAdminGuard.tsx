import React from 'react';
import { Navigate, useParams, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CompanyAdminGuard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { companySlug } = useParams<{ companySlug: string }>();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow Super Admin to access any company
  if (user?.role === 'SUPER_ADMIN') {
    return <Outlet />;
  }

  // For Company Admin, verify they belong to the company matching the URL slug
  const isAuthorized = 
    user?.role === 'COMPANY_ADMIN' && 
    user.company_slug === companySlug;

  if (!isAuthorized) {
    console.warn('Unauthorized access attempt to company:', companySlug);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default CompanyAdminGuard;
