import React, { useEffect, useState } from 'react';
import { mockEngine } from '../api/mockEngine';
import { TrendingUp, Users, ShoppingBag, AlertCircle, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    setMetrics(mockEngine.getMetrics());
  }, []);

  if (!metrics) return <div className="p-8 text-gray-400">Carregando Analytics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
           Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Faturamento Mensal" 
          value={metrics.faturamento_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          trend="+12.5%" 
          icon={TrendingUp} 
          color="blue"
        />
        <KpiCard 
          title="Pedidos este Mês" 
          value={metrics.vendas_mes || 0} 
          subtitle={`${metrics.orcamentos_abertos} Orçamentos Abertos`}
          icon={ShoppingBag} 
          color="emerald"
        />
        <KpiCard 
          title="Base de Clientes" 
          value={metrics.total_clientes} 
          subtitle="3 Novos esta semana"
          icon={Users} 
          color="purple"
        />
        <KpiCard 
          title="Estoque Crítico" 
          value={metrics.produtos_criticos} 
          subtitle="Produtos abaixo do mínimo"
          icon={AlertCircle} 
          color="red"
        />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART MOCK */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
             <Calendar size={18} /> Performance de Vendas
          </h3>
          <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-gray-100 gap-2">
             {metrics.pedidos_dia.map((v, i) => (
               <div key={i} className="w-full bg-blue-100 hover:bg-blue-200 rounded-t transition-all relative group flex flex-col justify-end">
                  <div 
                    style={{ height: `${Math.min(v * 5, 200)}px` }} 
                    className="bg-blue-500 rounded-t w-full opacity-80 group-hover:opacity-100 transition-all"
                  ></div>
                  <span className="text-xs text-center text-gray-400 mt-2 absolute -bottom-6 w-full">{i+10}/01</span>
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {v} Vendas
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* TOP CLIENTES LIST */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="font-semibold text-gray-700 mb-4">Top Clientes</h3>
           <div className="space-y-4">
              {metrics.top_clientes.map((cli, i) => (
                <div key={cli.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      #{i+1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cli.Razao_Social}</p>
                      <p className="text-xs text-gray-500 truncate">{cli.Ramo_Atividade} • {cli.Status_Cadastro}</p>
                   </div>
                   <div className="text-xs font-semibold text-blue-600">
                      {cli.Classificacao_ABC}
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}

const KpiCard = ({ title, value, subtitle, trend, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
         <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon size={20} />
         </div>
         {trend && (
           <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
             {trend} <TrendingUp size={10} />
           </span>
         )}
      </div>
      <div>
         <h4 className="text-sm font-medium text-gray-500">{title}</h4>
         <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
         {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
