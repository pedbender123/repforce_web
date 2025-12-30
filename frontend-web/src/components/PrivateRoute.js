import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege rotas com base no perfil exigido.
 * @param {string} requiredProfile - O perfil necessário ('sysadmin', 'admin' ou 'representante').
 */
export default function PrivateRoute({ children, requiredProfile }) {
  const { token, userProfile, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center">Carregando autenticação...</div>;
  }

  // 1. Não está logado? Vai para o login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Está logado, mas não tem o perfil correto?
  // EXCEÇÃO: SysAdmin pode acessar qualquer rota (Super User)
  if (requiredProfile && userProfile !== requiredProfile && userProfile !== 'sysadmin') {
    // Redireciona para a "home" correta do perfil do usuário
    let redirectTo = '/login';
    if (userProfile === 'sysadmin') redirectTo = '/sysadmin';
    if (userProfile === 'admin') redirectTo = '/admin';
    if (userProfile === 'representante') redirectTo = '/app';

    return <Navigate to={redirectTo} replace />;
  }

  // 3. Está logado e tem o perfil correto
  return children;
}