import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import SysAdminLayout from './components/SysAdminLayout';

// Public Pages
import Login from './pages/Login';
import SysAdminLogin from './pages/sysadmin/SysAdminLogin';

// App Pages (Sales Rep)
import AppDashboard from './pages/app/AppDashboard';
import AppClientList from './pages/app/AppClientList';
import AppClientDetails from './pages/app/AppClientDetails';
import AppClientForm from './pages/app/AppClientForm';
import AppOrderCreate from './pages/app/AppOrderCreate';
import AppRouteCreate from './pages/app/AppRouteCreate';

// Admin Pages (Tenant Admin)
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement'; // NOVO

// SysAdmin Pages (Global Admin)
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard';
import TenantManagement from './pages/sysadmin/TenantManagement';
import AllUserManagement from './pages/sysadmin/AllUserManagement';
import AreaManagement from './pages/sysadmin/AreaManagement';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <SysAdminAuthProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/sysadmin/login" element={<SysAdminLogin />} />
              
              {/* Root Redirect */}
              <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

              {/* APP ROUTES (Sales Rep) */}
              <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<AppDashboard />} />
                <Route path="clients" element={<AppClientList />} />
                <Route path="clients/new" element={<AppClientForm />} />
                <Route path="clients/:id" element={<AppClientDetails />} />
                <Route path="orders/new" element={<AppOrderCreate />} />
                <Route path="routes/new" element={<AppRouteCreate />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* ADMIN ROUTES (Tenant Owner) */}
              <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductForm />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RoleManagement />} /> {/* NOVO */}
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* SYSADMIN ROUTES (Platform Owner) */}
              <Route path="/sysadmin" element={<SysAdminLayout />}>
                <Route path="dashboard" element={<SysAdminDashboard />} />
                <Route path="tenants" element={<TenantManagement />} />
                <Route path="users" element={<AllUserManagement />} />
                <Route path="areas" element={<AreaManagement />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </SysAdminAuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;