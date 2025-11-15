import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SysAdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Painel do SysAdmin
      </h1>
      <p className="text-lg text-gray-600">
        Bem-vindo. Seu perfil é: <span className="font-semibold text-red-600">{userProfile}</span>.
      </p>
      <p className="mt-4">
        Use o menu à esquerda para gerenciar Tenants e outros Usuários do sistema.
      </p>
    </div>
  );
}