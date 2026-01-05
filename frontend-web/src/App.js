import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import CrmLayout from './layouts/CrmLayout';
import SystemLayout from './layouts/SystemLayout';

// Public Pages
import Login from './pages/system/Login';

// Admin Pages
import AdminDashboard from './pages/system/AdminDashboard';
import AdminConfigPage from './pages/config/AdminConfigPage';
import Webhooks from './pages/system/Webhooks';

// SysAdmin Pages (Global Admin)
import CompanyList from './pages/sysadmin/CompanyList';
import CompanyForm from './pages/sysadmin/CompanyForm';
import CRMDesigner from './pages/sysadmin/CRMDesigner';
import SettingsHub from './pages/sysadmin/SettingsHub';
import Billing from './pages/sysadmin/Billing';
import SysAdminDiagnostics from './pages/sysadmin/SysAdminDiagnostics';

// Core Modules (Dynamic)
// Core Modules (Dynamic)
// import EntityPage from './pages/crm/EntityPage';
// import ProfilePage from './pages/system/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* APP ROUTES (Sales Rep & Tenant Admin) - REDUCED (Redirects to Admin or Dashboard) */}
        <Route path="/app" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
          {/* Only Dashboard for now */}
          {/* <Route path="profile" element={<ProfilePage />} /> */}
          {/* <Route path=":entity" element={<EntityPage />} /> */}
          <Route path="dashboard" element={<div>User Dashboard Placeholder</div>} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ADMIN ROUTES (Tenant Owner) - REDUCED */}
        <Route path="/admin" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="config" element={<AdminConfigPage />} />
          {/* <Route path=":entity" element={<EntityPage />} /> */}
          {/* <Route path="webhooks" element={<Webhooks />} /> */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* SYSADMIN ROUTES (Platform Owner) */}
        <Route path="/sysadmin" element={<PrivateRoute requiredProfile="sysadmin"><SystemLayout /></PrivateRoute>}>
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/new" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyForm />} />
          <Route path="companies/:id/design" element={<CRMDesigner />} />
          <Route path="billing" element={<Billing />} />
          <Route path="config" element={<SettingsHub />} />
          <Route path="diagnostics" element={<SysAdminDiagnostics />} />
          <Route path="settings" element={<Navigate to="config" replace />} />
          <Route index element={<Navigate to="companies" replace />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;