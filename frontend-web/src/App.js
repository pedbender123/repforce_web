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
// Public Pages
import Login from './pages/Login';
import SysAdminLogin from './pages/SysAdminLogin';

// App Pages (Sales Rep)
import AppDashboard from './pages/AppDashboard';
// import AppClientList from './pages/AppClientList'; // LEGADO
import ClientList from './pages/crm/ClientList'; // NOVO UNIFICADO
import ProductList from './pages/crm/ProductList'; // NOVO UNIFICADO
import OrderList from './pages/crm/OrderList'; // NOVO UNIFICADO
import AppClientDetails from './pages/AppClientDetails';
import AppClientForm from './pages/AppClientForm';
import AppOrderCreate from './pages/AppOrderCreate';
import AppRouteCreate from './pages/AppRouteCreate';

// Admin Pages (Tenant Admin)
import AdminDashboard from './pages/AdminDashboard';
// import ProductList from './pages/AdminProductList'; // LEGADO - REMOVIDO
import ProductForm from './pages/AdminProductForm';
import UserManagement from './pages/AdminUserManagement';
import RoleManagement from './pages/AdminRoleManagement'; // NOVO

// SysAdmin Pages (Global Admin)
import SysAdminDashboard from './pages/SysAdminDashboard';
import TenantManagement from './pages/SysAdminTenantManagement';
import AllUserManagement from './pages/SysAdminAllUserManagement';
import AreaManagement from './pages/SysAdminAreaManagement';

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
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/new" element={<AppClientForm />} />
                <Route path="clients/:id" element={<AppClientDetails />} />
                <Route path="orders" element={<OrderList />} /> {/* NOVA ROTA */}
                <Route path="orders/new" element={<AppOrderCreate />} />
                <Route path="routes/new" element={<AppRouteCreate />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* ADMIN ROUTES (Tenant Owner) - Agora usa AppLayout (Layout Unificado) */}
              <Route path="/admin" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="clients" element={<ClientList />} /> {/* NOVA ROTA ADMIN */}
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductForm />} />
                <Route path="orders" element={<OrderList />} /> {/* NOVA ROTA ADMIN */}
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