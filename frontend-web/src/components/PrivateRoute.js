import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege rotas.
 * @param {string} profile - O perfil necessário ('admin' or 'representante').
 */
export default function PrivateRoute({ children, profile }) {
  const { token, userProfile, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    // TODO: Substituir por um componente de loading bonito
    return <div>Carregando autenticação...</div>;
  }

  // 1. Não está logado? Vai para o login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Está logado, mas não tem o perfil correto?
  if (profile && userProfile !== profile) {
    // Se um admin tentar acessar /app, ou rep tentar acessar /admin
    const redirectTo = userProfile === 'admin' ? '/admin' : '/app';
    return <Navigate to={redirectTo} replace />;
  }

  // 3. Está logado e tem o perfil correto
  return children;
}