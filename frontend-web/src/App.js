import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages - Auth
import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';

// Layouts
import DynamicLayout from './components/DynamicLayout';
import SysAdminLayout from './components/SysAdminLayout';

// Components de Proteção
import PrivateRoute from './components/PrivateRoute'; 
import SysAdminPrivateRoute from './components/SysAdminPrivateRoute'; 

// SysAdmin Pages
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import TenantManagement from './pages/sysadmin/TenantManagement';
import AllUserManagement from './pages/sysadmin/AllUserManagement';
import AreasManagement from './pages/sysadmin/AreasManagement'; // NOVO

// Configuração Dinâmica
import COMPONENT_MAP from './config/componentMap';
import apiClient from './api/apiClient';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [dynamicRoutes, setDynamicRoutes] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    if (user && !user.is_sysadmin) {
      setMenuLoading(true);
      apiClient.get('/navigation/menu')
        .then(response => {
          const areas = response.data;
          const routes = [];
          areas.forEach(area => {
            area.pages.forEach(page => {
              const Component = COMPONENT_MAP[page.component_key];
              if (Component) {
                routes.push({
                  path: page.path,
                  element: <Component />
                });
              }
            });
          });
          setDynamicRoutes(routes);
        })
        .catch(err => console.error("Erro rotas dinâmicas", err))
        .finally(() => setMenuLoading(false));
    }
  }, [user]);

  if (loading || menuLoading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <Routes>
      {/* 1. Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/sysadmin/login" element={<SysAdminLogin />} />

      {/* 2. SysAdmin (Layout Salesforce) */}
      <Route path="/sysadmin" element={
        <SysAdminPrivateRoute>
          <SysAdminLayout />
        </SysAdminPrivateRoute>
      }>
         <Route index element={<Navigate to="/sysadmin/dashboard" replace />} />
         <Route path="dashboard" element={<SysAdminDashboard />} />
         <Route path="tenants" element={<TenantManagement />} />
         <Route path="users" element={<AllUserManagement />} />
         <Route path="areas" element={<AreasManagement />} /> {/* ROTA NOVA */}
      </Route>

      {/* 3. Tenant App */}
      <Route path="/" element={
        <PrivateRoute>
          <DynamicLayout />
        </PrivateRoute>
      }>
          <Route index element={
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Bem-vindo ao RepForce.</p>
            </div>
          } />
          {dynamicRoutes.map((route, index) => (
             <Route key={index} path={route.path.replace(/^\//, '')} element={route.element} />
          ))}
          <Route path="*" element={<div className="p-8 text-red-500">404</div>} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SysAdminAuthProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SysAdminAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;