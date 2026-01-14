import React, { useState } from 'react';
import MainLayout from './layouts/MainLayout';
import { mockEngine } from './api/mockEngine';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('MOCK_AUTH') === 'true';
  });

  const handleLogin = (e) => {
    e.preventDefault();
    const user = e.target.username.value;
    const pass = e.target.password.value;
    
    // Bypass simples
    if (user === 'compasso' && pass === '123456') {
      localStorage.setItem('MOCK_AUTH', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Tente: compasso / 123456');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('MOCK_AUTH');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
           <h1 className="text-3xl font-bold text-slate-800 mb-2">RepForce v2</h1>
           <p className="text-gray-500 mb-8">Ambiente de Simulação Compasso</p>
           
           <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                  <input name="username" defaultValue="compasso" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input name="password" type="password" defaultValue="123456" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all mt-2">
                 Entrar no Sistema
              </button>
           </form>
           
           <div className="mt-6 p-4 bg-blue-50 text-blue-700 text-xs rounded-lg">
              <strong>Credenciais Demo:</strong><br/>
              User: compasso<br/>
              Pass: 123456
           </div>
        </div>
      </div>
    );
  }

  return <MainLayout onLogout={handleLogout} />;
}

export default App;
