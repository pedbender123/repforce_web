import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';

import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import SysAdminLayout from './components/SysAdminLayout';

import PrivateRoute from './components/PrivateRoute';
import SysAdminPrivateRoute from './components/SysAdminPrivateRoute';

// --- Páginas App (Representante) ---
import AppDashboard from './pages/app/AppDashboard';
import AppClientList from './pages/app/AppClientList';
import AppClientForm from './pages/app/AppClientForm'; // <--- IMPORTADO
import AppClientDetails from './pages/app/AppClientDetails';
import AppOrderCreate from './pages/app/AppOrderCreate';
import AppRouteCreate from './pages/app/AppRouteCreate';

// --- Páginas Admin (Tenant) ---
import AdminDashboard from './pages/admin/AdminDashboard';
import TenantUserManagement from './pages/admin/UserManagement';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';

// --- Páginas SysAdmin ---
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import TenantManagement from './pages/sysadmin/TenantManagement';
import SysAdminUserManagement from './pages/sysadmin/UserManagement';
import AllUserManagement from './pages/sysadmin/AllUserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/sysadmin/login" element={<SysAdminLogin />} />

        {/* --- APP REPRESENTANTE --- */}
        <Route path="/app" element={<PrivateRoute requiredProfile="representante"><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AppDashboard />} />
          <Route path="clients" element={<AppClientList />} />
          <Route path="clients/new" element={<AppClientForm />} /> {/* <--- ROTA NOVA */}
          <Route path="clients/:id" element={<AppClientDetails />} />
          <Route path="orders/new" element={<AppOrderCreate />} />
          <Route path="routes/new" element={<AppRouteCreate />} />
        </Route>

        {/* --- ADMIN TENANT --- */}
        <Route path="/admin" element={<PrivateRoute requiredProfile="admin"><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<TenantUserManagement />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
        </Route>

        {/* --- SYSADMIN --- */}
        <Route path="/sysadmin" element={<SysAdminPrivateRoute><SysAdminLayout /></SysAdminPrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SysAdminDashboard />} />
          <Route path="systems-users" element={<SysAdminUserManagement />} />
          <Route path="tenants" element={<TenantManagement />} />
          <Route path="all-users" element={<AllUserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;