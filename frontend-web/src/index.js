import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext'; // <-- NOVO

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>        {/* Contexto para /app e /admin */}
        <SysAdminAuthProvider> {/* Contexto para /sysadmin */}
          <App />
        </SysAdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);