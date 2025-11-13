import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';

// Páginas do App (Representante)
import AppDashboard from './pages/app/AppDashboard';
import AppClientList from './pages/app/AppClientList';
import AppOrderCreate from './pages/app/AppOrderCreate';

// Páginas do Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import TenantManagement from './pages/admin/TenantManagement'; // Nova página

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas para Representantes (/app/*) */}
        <Route
          path="/app"
          element={
            <PrivateRoute profile="representante">
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Redireciona /app para /app/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AppDashboard />} />
          <Route path="clients" element={<AppClientList />} />
          <Route path="orders/new" element={<AppOrderCreate />} />
        </Route>

        {/* Rotas protegidas para Admin (/admin/*) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute profile="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tenants" element={<TenantManagement />} /> {/* Nova rota */}
        </Route>

        {/* Redirecionamento padrão (se não estiver logado, vai para login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;