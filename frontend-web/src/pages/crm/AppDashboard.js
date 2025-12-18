import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

function KpiCard({ title, value, icon: Icon, color = "blue", subtext }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
          {subtext && <p className="text-xs text-green-600 mt-1 flex items-center"><TrendingUpIcon className="w-3 h-3 mr-1" /> {subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function AppDashboard() {
  const { userProfile } = useAuth();
  const [period, setPeriod] = useState('30d');

  // Queries
  const { data: kpis } = useQuery(['kpis', period], async () => {
    const res = await apiClient.get(`/crm/analytics/kpis?time_range=${period}`);
    return res.data;
  });

  const { data: history } = useQuery(['sales-history', period], async () => {
    const res = await apiClient.get(`/crm/analytics/sales-history?days=${period === '7d' ? 7 : 30}`);
    return res.data;
  });

  const { data: topProducts } = useQuery(['top-products'], async () => {
    const res = await apiClient.get(`/crm/analytics/top-products`);
    return res.data;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Vendas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Visão geral do seus resultados.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 3 meses</option>
        </select>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Vendido"
          value={kpis ? formatMoney(kpis.total_sales) : '...'}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <KpiCard
          title="Pedidos Realizados"
          value={kpis?.order_count || 0}
          icon={ShoppingBagIcon}
          color="blue"
        />
        <KpiCard
          title="Ticket Médio"
          value={kpis ? formatMoney(kpis.avg_ticket) : '...'}
          icon={TrendingUpIcon}
          color="purple"
        />
        <KpiCard
          title="Clientes Ativos"
          value={kpis?.active_clients || 0}
          icon={UserGroupIcon}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evolução de Vendas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top 5 Produtos</h3>
          <div className="space-y-4">
            {topProducts?.map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{prod.name}</p>
                    <p className="text-xs text-gray-500">{prod.quantity} unidades</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatMoney(prod.total)}
                </div>
              </div>
            ))}
            {!topProducts?.length && <p className="text-gray-500 text-sm">Sem dados de venda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}