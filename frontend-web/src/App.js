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

// --- Layouts e Páginas Novas ---
import SysAdminLayout from './components/SysAdminLayout'; 
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import TenantManagement from './pages/sysadmin/TenantManagement';
import SysAdminUserManagement from './pages/sysadmin/UserManagement'; // Renomeado

// --- Páginas Admin (Tenant) ---
import AdminDashboard from './pages/admin/AdminDashboard';
import TenantUserManagement from './pages/admin/UserManagement'; // Renomeado

// --- Páginas App (Representante) ---
import AppDashboard from './pages/app/AppDashboard';
import AppClientList from './pages/app/AppClientList';
import AppOrderCreate from './pages/app/AppOrderCreate';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* === ROTAS DO REPRESENTANTE === */}
        <Route
          path="/app"
          element={
            <PrivateRoute requiredProfile="representante">
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AppDashboard />} />
          <Route path="clients" element={<AppClientList />} />
          <Route path="orders/new" element={<AppOrderCreate />} />
        </Route>

        {/* === ROTAS DO ADMIN (TENANT) === */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredProfile="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<TenantUserManagement />} />
        </Route>

        {/* === ROTAS DO SYSADMIN (SISTEMA) === */}
        <Route
          path="/sysadmin"
          element={
            <PrivateRoute requiredProfile="sysadmin">
              <SysAdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SysAdminDashboard />} />
          <Route path="users" element={<SysAdminUserManagement />} />
          <Route path="tenants" element={<TenantManagement />} />
        </Route>

        {/* Redirecionamento padrão (se não estiver logado, vai para login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;