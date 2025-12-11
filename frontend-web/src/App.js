import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSysAdminAuth } from './context/SysAdminAuthContext';
import apiClient from './api/apiClient';
import sysAdminApiClient from './api/sysAdminApiClient';
import TEMPLATES_MAP from './config/templatesMap';

import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import DynamicLayout from './components/DynamicLayout';
import SysAdminLayout from './components/SysAdminLayout';

// Rotas Tenant
const DynamicTenantRoutes = () => {
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    apiClient.get('/navigation/menu').then(res => {
        const r = [];
        res.data.forEach(area => area.pages.forEach(p => {
            const Comp = TEMPLATES_MAP[p.component_key];
            if(Comp) r.push({ path: p.path, element: <Comp config={p.config_json} /> });
        }));
        setRoutes(r);
    }).catch(() => {});
  }, []);

  return (
    <Routes>
      <Route element={<DynamicLayout />}>
        {routes.map((r, i) => <Route key={i} path={r.path.replace('/app', '')} element={r.element} />)}
        <Route path="*" element={<div>Bem-vindo ao RepForce</div>} />
      </Route>
    </Routes>
  );
};

// Rotas SysAdmin
const DynamicSysAdminRoutes = () => {
  const [menu, setMenu] = useState([]);
  useEffect(() => {
    sysAdminApiClient.get('/navigation/menu').then(res => setMenu(res.data)).catch(() => {});
  }, []);

  return (
    <Routes>
      <Route element={<SysAdminLayout menuItems={menu} />}>
        <Route path="dashboard" element={<SysAdminDashboard />} />
        {menu.flatMap(a => a.pages).map((p, i) => {
             const Comp = TEMPLATES_MAP[p.component_key];
             const path = p.path.replace('/sysadmin/', '');
             return Comp ? <Route key={i} path={path} element={<Comp config={p.config_json} />} /> : null;
        })}
      </Route>
    </Routes>
  );
};

export default function App() {
  const { token } = useAuth();
  const { token: saToken } = useSysAdminAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/sysadmin/login" element={<SysAdminLogin />} />
        
        <Route path="/sysadmin/*" element={saToken ? <DynamicSysAdminRoutes /> : <Navigate to="/sysadmin/login" />} />
        <Route path="/app/*" element={token ? <DynamicTenantRoutes /> : <Navigate to="/login" />} />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}