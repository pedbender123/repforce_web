import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AppDashboard() {
  const { userProfile } = useAuth();
  
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Bem-vindo, Representante!
      </h1>
      <p className="text-lg text-gray-600">
        Este é o seu painel. Seu perfil é: <span className="font-semibold text-repforce-primary">{userProfile}</span>.
      </p>
      <p className="mt-4">
        Use o menu à esquerda para navegar.
      </p>
    </div>
  );
}