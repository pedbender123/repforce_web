import React from 'react';

export default function DashboardPlaceholder() {
  return (
    <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-gray-700 dark:text-white mb-4">Dashboard</h1>
      <div className="w-24 h-2 bg-repforce-primary rounded-full mb-6"></div>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Os widgets configuráveis serão carregados aqui. Esta tela será montada dinamicamente baseada nos KPIs que o usuário escolher.
      </p>
    </div>
  );
}