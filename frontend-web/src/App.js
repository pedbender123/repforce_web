import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// --- Logins ---
import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin'; // <-- NOVO LOGIN

// --- Layouts ---
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import SysAdminLayout from './components/SysAdminLayout';

// --- Private Routes ---
import PrivateRoute from './components/PrivateRoute';
import SysAdminPrivateRoute from './components/SysAdminPrivateRoute'; // <-- NOVA ROTA PRIVADA

// --- Páginas App (Representante) ---
import AppDashboard from './pages/app/AppDashboard';
import AppClientList from './pages/app/AppClientList';
import AppOrderCreate from './pages/app/AppOrderCreate';

// --- Páginas Admin (Tenant) ---
import AdminDashboard from './pages/admin/AdminDashboard';
import TenantUserManagement from './pages/admin/UserManagement';

// --- Páginas SysAdmin (Sistema) ---
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import TenantManagement from './pages/sysadmin/TenantManagement';
import SysAdminUserManagement from './pages/sysadmin/UserManagement';
import AllUserManagement from './pages/sysadmin/AllUserManagement'; // <-- NOVA PÁGINA

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/sysadmin/login" element={<SysAdminLogin />} />

        {/* --- ROTAS PRIVADAS /APP (REPRESENTANTE) --- */}
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

        {/* --- ROTAS PRIVADAS /ADMIN (TENANT) --- */}
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

        {/* --- ROTAS PRIVADAS /SYSADMIN (SISTEMA) --- */}
        <Route
          path="/sysadmin"
          element={
            <SysAdminPrivateRoute> {/* <-- USA A NOVA ROTA PRIVADA */}
              <SysAdminLayout />
            </SysAdminPrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SysAdminDashboard />} />
          <Route path="systems-users" element={<SysAdminUserManagement />} />
          <Route path="tenants" element={<TenantManagement />} />
          <Route path="all-users" element={<AllUserManagement />} /> {/* <-- ROTA PARA VER TUDO */}
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;