import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages - Auth
import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';

// Layouts
import DynamicLayout from './components/DynamicLayout';
import SysAdminLayout from './components/SysAdminLayout'; // Legacy Layout para SysAdmin fixo se quiser manter
import SysAdminPrivateRoute from './components/SysAdminPrivateRoute';
import PrivateRoute from './components/PrivateRoute';

// Novo Mapa de Templates
import TEMPLATES_MAP from './config/templatesMap';
import apiClient from './api/apiClient';
import sysAdminApiClient from './api/sysAdminApiClient';

// Componente para renderizar rotas dinâmicas
const DynamicRoutesHandler = () => {
  const { user } = useAuth();
  const [dynamicRoutes, setDynamicRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Decide qual cliente usar baseado no perfil (SysAdmin ou User normal)
        // OBS: Se for SysAdmin, ele usa o layout do SysAdmin mas pode consumir a mesma lógica de menu
        // se o backend retornar o menu correto para tenant_id=1
        const client = user?.is_sysadmin ? sysAdminApiClient : apiClient;
        const endpoint = user?.is_sysadmin ? '/sysadmin/menu' : '/navigation/menu'; 
        
        // Fallback: Se o backend navigation.py lida com tudo no /navigation/menu usando o token, usamos o padrão
        const response = await apiClient.get('/navigation/menu');
        
        const areas = response.data;
        const routes = [];

        areas.forEach(area => {
          area.pages.forEach(page => {
            const TemplateComponent = TEMPLATES_MAP[page.component_key];
            if (TemplateComponent) {
              routes.push({
                path: page.path,
                element: <TemplateComponent config={page.config_json} />
              });
            } else {
              console.warn(`Template não encontrado: ${page.component_key}`);
            }
          });
        });
        setDynamicRoutes(routes);
      } catch (err) {
        console.error("Erro ao carregar rotas dinâmicas", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMenu();
    } else {
        setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando Sistema...</div>;

  return (
    <Routes>
       <Route element={<DynamicLayout />}>
          <Route index element={<div className="p-10 text-gray-500">Bem-vindo ao Sistema. Selecione uma opção no menu.</div>} />
          {dynamicRoutes.map((route, idx) => (
            // Remove a barra inicial do path para funcionar como child route
            <Route key={idx} path={route.path.replace(/^\//, '')} element={route.element} />
          ))}
          <Route path="*" element={<div className="p-10 text-red-500">Página não encontrada (404)</div>} />
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
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/sysadmin/login" element={<SysAdminLogin />} />

              {/* Rota SysAdmin (Pode ser fixa ou dinâmica, aqui deixei dinâmica também se quiser) */}
              {/* Se quiser manter o layout fixo antigo para sysadmin, use o código antigo aqui. 
                  Mas a ideia é unificar. Vou assumir unificação no DynamicLayout. */}
              
              {/* Rotas da Aplicação (Protegidas) */}
              <Route path="/*" element={
                <PrivateRoute>
                   <DynamicRoutesHandler />
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