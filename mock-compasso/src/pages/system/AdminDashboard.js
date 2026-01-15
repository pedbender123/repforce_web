import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Activity, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-300 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Painel Geral
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visão geral do sistema (Em construção).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          <div className="p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                      <BarChart size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Vendas Mensais</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ 0,00</p>
          </div>

           <div className="p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                      <Users size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Novos Leads</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>

           <div className="p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                      <Activity size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Atividades</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
      </div>
    </div>
  );
}