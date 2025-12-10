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
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';

import TEMPLATES_MAP from './config/templatesMap';
import apiClient from './api/apiClient';
import sysAdminApiClient from './api/sysAdminApiClient';

// --- ROTAS TENANT ---
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
        <Route index element={<div className="p-10">Bem-vindo. Selecione uma opção.</div>} />
        {routes.map((r, i) => (
           <Route key={i} path={r.path.replace(/^\//, '')} element={r.element} />
        ))}
      </Route>
    </Routes>
  );
};

// --- ROTAS SYSADMIN ---
const DynamicSysAdminRoutes = () => {
  const { userProfile } = useSysAdminAuth();
  const [routes, setRoutes] = useState([]);
  const [menuItems, setMenuItems] = useState([]); 

  useEffect(() => {
    if (userProfile === 'sysadmin') {
      console.log("🔍 Buscando menu do SysAdmin...");
      sysAdminApiClient.get('/navigation/menu')
        .then(res => {
          console.log("✅ Menu recebido do Backend:", res.data); // LOG DE DEBUG
          
          if (res.data.length === 0) {
             console.warn("⚠️ ALERTA: O menu veio vazio do backend!");
          }

          setMenuItems(res.data);
          const newRoutes = [];
          
          res.data.forEach(area => {
            area.pages.forEach(page => {
              const Comp = TEMPLATES_MAP[page.component_key];
              // Remove o prefixo /sysadmin/ para encaixar na rota pai
              const relativePath = page.path.replace('/sysadmin/', '');
              
              if (Comp) {
                  newRoutes.push({ path: relativePath, element: <Comp config={page.config_json} /> });
              } else {
                  console.warn(`Template não encontrado no mapa: ${page.component_key}`);
              }
            });
          });
          setRoutes(newRoutes);
        })
        .catch(err => console.error("❌ Erro ao buscar menu sysadmin:", err));
    }
  }, [userProfile]);

  return (
    <Routes>
      {/* Passamos o menuItems para o Layout renderizar as abas */}
      <Route element={<SysAdminLayout menuItems={menuItems} />}>
         <Route index element={<SysAdminDashboard />} />
         <Route path="dashboard" element={<SysAdminDashboard />} />
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
              <Route path="/login" element={<Login />} />
              <Route path="/sysadmin/login" element={<SysAdminLogin />} />

              <Route path="/sysadmin/*" element={
                <SysAdminPrivateRoute>
                  <DynamicSysAdminRoutes />
                </SysAdminPrivateRoute>
              } />

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