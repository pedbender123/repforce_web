import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, AlertCircle, Calendar } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
    // Mock Data for MVP - In real app would fetch from backend aggregation
    const stats = [
        { label: 'Vendas Hoje', value: 'R$ 14.500', trend: '+12%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Novos Clientes', value: '12', trend: '+3', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pedidos Pendentes', value: '5', trend: 'Ação Req.', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Ticket Médio', value: 'R$ 2.450', trend: '+5%', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Visão Geral</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Bem-vindo de volta, Pedro.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoje, 15 Jan</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.trend.includes('+') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {s.trend}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Performance de Vendas</h3>
                    <div className="flex-1 flex items-end justify-between px-4 gap-2">
                        {[35, 60, 45, 80, 55, 75, 60, 90, 50, 65, 85, 95].map((h, i) => (
                            <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm relative group h-full flex items-end">
                                <div
                                    className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-sm hover:bg-blue-700 transition-all relative"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
                        <span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Metas do Mês</h3>
                    <div className="relative flex items-center justify-center py-8">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset="110" className="text-blue-600 dark:text-blue-500" />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">75%</span>
                            <p className="text-xs text-gray-500">Concluído</p>
                        </div>
                    </div>
                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pisos e Rev.</span>
                            <span className="font-bold text-gray-800 dark:text-white">R$ 45k / 60k</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tintas</span>
                            <span className="font-bold text-gray-800 dark:text-white">R$ 12k / 15k</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
