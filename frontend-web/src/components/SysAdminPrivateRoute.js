import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSysAdminAuth } from '../context/SysAdminAuthContext';

/**
 * Protege rotas de SysAdmin.
 */
export default function SysAdminPrivateRoute({ children }) {
  const { token, userProfile, isLoadingAuth } = useSysAdminAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center">Carregando autenticação...</div>;
  }

  // 1. Não está logado (como sysadmin)? Vai para o login do sysadmin
  if (!token) {
    return <Navigate to="/sysadmin/login" state={{ from: location }} replace />;
  }

  // 2. Está logado, mas não é sysadmin?
  if (userProfile !== 'sysadmin') {
     return <Navigate to="/sysadmin/login" replace />;
  }

  // 3. Está logado e é sysadmin
  return children;
}