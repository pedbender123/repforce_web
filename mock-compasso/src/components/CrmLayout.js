import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CrmLayout = () => {
    const { authenticated, user, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
        return <div className="flex h-screen items-center justify-center">Carregando CRM...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    // Verifica se o usuário tem contexto de Tenant
    // Se for SysAdmin (perfil global), talvez ele não tenha tenant_id no token padrão se logado via /auth/token?
    // O backend agora garante tenant_id para todos (SysAdmin -> Systems).
    if (!user?.tenant_id) {
        alert("Erro de Segurança: Usuário sem Tenant vinculado.");
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="crm-layout-wrapper">
            {/* Aqui poderíamos ter Sidebar Global do CRM se quiséssemos */}
            <Outlet />
        </div>
    );
};

export default CrmLayout;
