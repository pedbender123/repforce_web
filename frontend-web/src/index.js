import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SysAdminAuthProvider } from './context/SysAdminAuthContext';
import { ThemeProvider } from './context/ThemeContext'; // <--- ADICIONE ISSO

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider> {/* <--- ADICIONE ISSO AQUI ENVOLVENDO TUDO */}
        <AuthProvider>        
          <SysAdminAuthProvider> 
            <App />
          </SysAdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);