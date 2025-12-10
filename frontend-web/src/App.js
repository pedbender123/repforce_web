import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SysAdminAuthProvider, useSysAdminAuth } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';
import DynamicLayout from './components/DynamicLayout';
import SysAdminLayout from './components/SysAdminLayout';
import SysAdminPrivateRoute from './components/SysAdminPrivateRoute';
import PrivateRoute from './components/PrivateRoute';
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard'; // Dashboard fixo inicial

import TEMPLATES_MAP from './config/templatesMap';
import apiClient from './api/apiClient';
import sysAdminApiClient from './api/sysAdminApiClient';

// --- COMPONENTE QUE CARREGA ROTAS DO TENANT (User Comum) ---
const DynamicTenantRoutes = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (user) {
      apiClient.get('/navigation/menu').then(res => {
        const newRoutes = [];
        res.data.forEach(area => {
          area.pages.forEach(page => {
            const Comp = TEMPLATES_MAP[page.component_key];
            if (Comp) newRoutes.push({ path: page.path, element: <Comp config={page.config_json} /> });
          });
        });
        setRoutes(newRoutes);
      }).catch(err => console.error("Erro menu tenant", err));
    }
  }, [user]);

  return (
    <Routes>
      <Route element={<DynamicLayout />}>
        <Route index element={<div className="p-10">Bem-vindo.</div>} />
        {routes.map((r, i) => (
           <Route key={i} path={r.path.replace(/^\//, '')} element={r.element} />
        ))}
      </Route>
    </Routes>
  );
};

// --- COMPONENTE QUE CARREGA ROTAS DO SYSADMIN (Super User) ---
const DynamicSysAdminRoutes = () => {
  const { userProfile } = useSysAdminAuth();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (userProfile === 'sysadmin') {
      // SysAdmin usa o client especial
      sysAdminApiClient.get('/navigation/menu').then(res => {
        const newRoutes = [];
        res.data.forEach(area => {
          area.pages.forEach(page => {
            const Comp = TEMPLATES_MAP[page.component_key];
            // Remove o prefixo /sysadmin/ para encaixar na rota pai
            const relativePath = page.path.replace('/sysadmin/', '');
            if (Comp) newRoutes.push({ path: relativePath, element: <Comp config={page.config_json} /> });
          });
        });
        setRoutes(newRoutes);
      }).catch(err => console.error("Erro menu sysadmin", err));
    }
  }, [userProfile]);

  return (
    <Routes>
      <Route element={<SysAdminLayout />}>
         <Route index element={<SysAdminDashboard />} />
         <Route path="dashboard" element={<SysAdminDashboard />} />
         {/* Renderiza as rotas dinâmicas (Tenants, Users, etc) */}
         {routes.map((r, i) => (
           <Route key={i} path={r.path} element={r.element} />
         ))}
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
            <Routes>
              {/* Login Screens */}
              <Route path="/login" element={<Login />} />
              <Route path="/sysadmin/login" element={<SysAdminLogin />} />

              {/* Área SysAdmin */}
              <Route path="/sysadmin/*" element={
                <SysAdminPrivateRoute>
                  <DynamicSysAdminRoutes />
                </SysAdminPrivateRoute>
              } />

              {/* Área Tenant/App */}
              <Route path="/*" element={
                <PrivateRoute>
                   <DynamicTenantRoutes />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </SysAdminAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;