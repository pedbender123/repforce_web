import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredProfile }) {
  const { status, userProfile, isSysAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Validando acesso...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Login
  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Privilege Check (SysAdmin is a pass-through)
  if (isSysAdmin) {
    return children;
  }

  // 3. Profile Check
  if (requiredProfile && userProfile !== requiredProfile) {
    // Redirect to fallback based on actual profile
    const fallbackMap = {
      'admin': '/admin',
      'representante': '/app',
      'sysadmin': '/sysadmin'
    };
    const target = fallbackMap[userProfile] || '/login';
    return <Navigate to={target} replace />;
  }

  return children;
}