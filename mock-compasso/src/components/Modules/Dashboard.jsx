import React from 'react';
import { Plus, User } from 'lucide-react';

const Dashboard = () => {
    // Mock data for now, could be connected to API later
    const stats = [
        { l: 'Vendas', v: 'R$ 450k', c: 'text-blue-600 dark:text-blue-400' },
        { l: 'Meta', v: '82%', c: 'text-emerald-600 dark:text-emerald-400' },
        { l: 'Pedidos', v: '24', c: 'text-gray-800 dark:text-gray-200' },
        { l: 'Orçamentos', v: '12', c: 'text-orange-600 dark:text-orange-400' }
    ];

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map((k, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-sm shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">{k.l}</p>
                        <p className={`text-2xl font-bold ${k.c}`}>{k.v}</p>
                    </div>
                ))}
            </div>

            {/* Charts & Actions */}
            <div className="grid grid-cols-3 gap-4 h-96">
                {/* Performance Chart Mock */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-sm shadow-sm border border-gray-200 dark:border-gray-700 col-span-2">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 text-sm uppercase tracking-wide">Performance</h3>
                    <div className="flex h-64 items-end justify-around px-4 border-b border-gray-200 dark:border-gray-700">
                        {[45, 60, 35, 80, 55, 90].map((h, i) => (
                            <div key={i} className="w-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-colors" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>JAN</span><span>JUN</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-sm shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 text-sm uppercase tracking-wide">Acesso Rápido</h3>
                    <div className="space-y-2">
                        {[
                            { i: Plus, t: 'Novo Pedido' },
                            { i: User, t: 'Cadastrar Cliente' }
                        ].map((b, i) => (
                            <button key={i} className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-sm text-blue-600 dark:text-blue-400">
                                    <b.i className="w-4 h-4" />
                                </div>
                                {b.t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
