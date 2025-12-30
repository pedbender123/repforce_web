import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import CrmLayout from './layouts/CrmLayout';
import SystemLayout from './layouts/SystemLayout';
import AppLayout from './components/AppLayout'; // Keep for nested routes if needed, or replace usage.
// Note: In CrmLayout implementation, I defined Sidebar logic. 
// But App.js line 72 uses <CrmLayout><AppLayout>...
// If CrmLayout mirrors AppLayout, we don't need nested AppLayout for sidebar.
// But AppLayout might be expected by existing structure?
// Wait, CrmLayout code I wrote IS AppLayout logic.
// So usage should be: <Route element={<CrmLayout />}> ... children ... </Route>
// Not <Route element={<CrmLayout />}><Route element={<AppLayout />}...

// Public Pages
import Login from './pages/system/Login'; // Tenant Login
import SysAdminLogin from './pages/sysadmin/Login'; // SysAdmin Login
import Lobby from './pages/system/Lobby';

// App Pages (Sales Rep)
import AppDashboard from './pages/crm/AppDashboard';
import ClientList from './pages/crm/ClientList';
import ProductList from './pages/crm/ProductList';
import OrderList from './pages/crm/OrderList';
import AppClientDetails from './pages/crm/AppClientDetails';
import AppClientForm from './pages/crm/AppClientForm';
import AppOrderCreate from './pages/crm/AppOrderCreate';
import AppRouteCreate from './pages/crm/AppRouteCreate';
import ProductDetails from './pages/crm/ProductDetails';
import OrderDetails from './pages/crm/OrderDetails';

// Admin Pages (Tenant Admin)
import AdminDashboard from './pages/system/AdminDashboard';
import ProductForm from './pages/crm/AdminProductForm';
import AdminConfigPage from './pages/config/AdminConfigPage';
import Webhooks from './pages/system/Webhooks';

// SysAdmin Pages (Global Admin)
import CompanyList from './pages/sysadmin/CompanyList';
import CompanyForm from './pages/sysadmin/CompanyForm';
import SettingsHub from './pages/sysadmin/SettingsHub';
import Billing from './pages/sysadmin/Billing';
import SysAdminDashboard from './pages/system/SysAdminDashboard'; // Legacy? Or keep?
// "Área SysAdmin (Gestão de Empresas) -> Rota: /sysadmin/companies"
// User implies SysAdmin Dashboard might be just redirects to Companies?
// Or I keep SysAdminDashboard at /sysadmin/dashboard if user wants.
// But SystemLayout Sidebar only has "Empresas" and "Faturamento".
// So Dashboard is likely "Empresas".
// I'll set /sysadmin index to companies.

import ProfilePage from './pages/system/ProfilePage';

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

              {/* Lobby (Select Tenant) */}
              <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />

              {/* Root Redirect */}
              <Route path="/" element={<Navigate to="/lobby" replace />} />

              {/* APP ROUTES (Sales Rep & Tenant Admin) */}
              {/* Using CrmLayout as the wrapper */}
              <Route path="/app" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<AppDashboard />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/new" element={<AppClientForm />} />
                <Route path="clients/:id" element={<AppClientDetails />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="orders/new" element={<AppOrderCreate />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="routes/new" element={<AppRouteCreate />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* ADMIN ROUTES (Tenant Owner) */}
              <Route path="/admin" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="config" element={<AdminConfigPage />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* SYSADMIN ROUTES (Platform Owner) */}
              <Route path="/sysadmin" element={<SystemLayout />}>
                <Route path="companies" element={<CompanyList />} />
                <Route path="companies/new" element={<CompanyForm />} />
                <Route path="billing" element={<Billing />} />
                <Route path="config" element={<SettingsHub />} />
                <Route path="settings" element={<Navigate to="config" replace />} />
                {/* Fallback to companies */}
                <Route index element={<Navigate to="companies" replace />} />
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