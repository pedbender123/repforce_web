import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import CrmLayout from './layouts/CrmLayout';
import SystemLayout from './layouts/SystemLayout';

// Public Pages
import Login from './pages/system/Login';

// Admin Pages
import AdminDashboard from './pages/system/AdminDashboard';
import TenantSettingsHub from './pages/admin/TenantSettingsHub';

// SysAdmin Pages (Global Admin)

import CRMDesigner from './pages/sysadmin/CRMDesigner';
import SettingsHub from './pages/sysadmin/SettingsHub';

// Core Modules (Dynamic)
import { BuilderProvider } from './context/BuilderContext'; // Builder / Engine
import DatabaseEditor from './pages/editor/DatabaseEditor'; // REFAC: New Editor
import NavigationEditor from './pages/editor/NavigationEditor'; // REFAC: New Nav Editor
import WorkflowManager from './pages/builder/WorkflowManager';

import MainDashboardWrapper from './pages/app/MainDashboardWrapper'; // NEW: Dynamic Dashboard
import DynamicPageLoader from './pages/app/DynamicPageLoader'; // NEW: Dynamic Page
import GroupPlaceholder from './pages/app/GroupPlaceholder';
import TrailsManager from './pages/builder/TrailsManager';
import TrailBuilder from './components/builder/trail/TrailBuilder';
import { TabProvider } from './context/TabContext';

function App() {
  return (
    <BuilderProvider>
      <Router>
        <TabProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* APP ROUTES (Sales Rep & Tenant Admin) - REDUCED (Redirects to Admin or Dashboard) */}
            <Route path="/app" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
              {/* Only Dashboard for now */}
              {/* Only Dashboard for now */}
              <Route path="dashboard" element={<MainDashboardWrapper />} />

              {/* Builder Routes */}
              <Route path="page/:pageId" element={<DynamicPageLoader />} />
              <Route path="group/:groupId" element={<GroupPlaceholder />} />
              <Route path="editor/database" element={<DatabaseEditor />} />
              <Route path="editor/navigation" element={<NavigationEditor />} />
              <Route path="editor/workflows" element={<WorkflowManager />} />
              {/* ActionManager moved to SettingsHub */}
              {/* ActionManager moved to SettingsHub */}
              <Route path="editor/trails" element={<TrailsManager />} />
              
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* ADMIN ROUTES (Tenant Owner) - REDUCED */}
            <Route path="/admin" element={<PrivateRoute><CrmLayout /></PrivateRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* SEPARATE CONFIGURATION HUB (No standard CrmLayout, using its own sidebar) */}
            <Route path="/admin/config" element={<PrivateRoute><TenantSettingsHub /></PrivateRoute>} />

            {/* SYSADMIN ROUTES (Platform Owner) */}
            <Route path="/sysadmin" element={<PrivateRoute requiredProfile="sysadmin"><SystemLayout /></PrivateRoute>}>
              <Route path="companies/:id/design" element={<CRMDesigner />} />
              <Route path="config" element={<SettingsHub />} />
              <Route path="settings" element={<Navigate to="config" replace />} />
              <Route index element={<Navigate to="config" replace />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </TabProvider>
      </Router>
    </BuilderProvider>
  );
}

const BuilderWrapper = () => {
    const { trailId } = useParams();
    return <TrailBuilder trailId={trailId} />;
};

export default App;