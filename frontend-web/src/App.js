import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import AppLayout from './components/AppLayout';
import SysAdminLayout from './components/SysAdminLayout';

// Public Pages
// Public Pages
import Login from './pages/system/Login';
import SysAdminLogin from './pages/system/SysAdminLogin';

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
import ProductForm from './pages/crm/AdminProductForm'; // Moved to CRM
import UserManagement from './pages/system/AdminUserManagement';
import RoleManagement from './pages/system/AdminRoleManagement';
import AdminCustomFields from './pages/system/AdminCustomFields';
import AdminPricingRules from './pages/system/AdminPricingRules';

// SysAdmin Pages (Global Admin)
import SysAdminDashboard from './pages/system/SysAdminDashboard';
import TenantManagement from './pages/system/SysAdminTenantManagement';
import AllUserManagement from './pages/system/SysAdminAllUserManagement';
import AreaManagement from './pages/system/SysAdminAreaManagement';
import SysAdminDiagnostics from './pages/system/SysAdminDiagnostics';
import ConfigPage from './pages/config/ConfigPage';
import ProfilePage from './pages/system/ProfilePage';
import AdminConfigPage from './pages/config/AdminConfigPage';

import CrmLayout from './components/CrmLayout';

// ... (imports)

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
              <Route path="/app" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
                <Route element={<AppLayout />}>
                  <Route path="dashboard" element={<AppDashboard />} />
                  <Route path="clients" element={<ClientList />} />
                  <Route path="clients/new" element={<AppClientForm />} />


                  <Route path="clients/:id" element={<AppClientDetails />} />
                  <Route path="orders" element={<OrderList />} />
                  <Route path="orders/new" element={<AppOrderCreate />} />
                  <Route path="orders/:id" element={<OrderDetails />} />
                  <Route path="routes/new" element={<AppRouteCreate />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* ADMIN ROUTES (Tenant Owner) */}
              <Route path="/admin" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
                <Route element={<AppLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="clients" element={<ClientList />} />
                  <Route path="products" element={<ProductList />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id" element={<ProductDetails />} />
                  <Route path="orders" element={<OrderList />} />
                  <Route path="orders/:id" element={<OrderDetails />} />
                  {/* New Config Page replaces individual management pages in Sidebar */}
                  <Route path="config" element={<AdminConfigPage />} />

                  {/* Legacy routes kept but not linked in Sidebar, or redirect? */}
                  {/* Let's keep them accessible if someone types URL, or we can remove them. 
                      Plan said: consolidate. AdminConfigPage imports them as components.
                      So we don't strictly need these routes unless we want deep linking.
                      For now, disabling direct route to force use of Config Page tabs helps consistency.
                  */}
                  {/* <Route path="users" element={<UserManagement />} /> */}
                  {/* <Route path="roles" element={<RoleManagement />} /> */}
                  {/* <Route path="fields" element={<AdminCustomFields />} /> */}
                  {/* <Route path="rules" element={<AdminPricingRules />} /> */}

                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* SHARED PROFILE ROUTE (App Context) */}
              <Route path="/app" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
                <Route element={<AppLayout />}>
                  {/* ... existing app routes ... */}
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>


              {/* SYSADMIN ROUTES (Platform Owner) */}
              <Route path="/sysadmin" element={<SysAdminLayout />}>
                <Route path="dashboard" element={<SysAdminDashboard />} />
                <Route path="tenants" element={<TenantManagement />} />
                <Route path="users" element={<AllUserManagement />} />
                <Route path="areas" element={<AreaManagement />} />
                <Route path="config" element={<ConfigPage />} />
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