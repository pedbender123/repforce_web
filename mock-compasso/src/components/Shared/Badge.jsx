import React from 'react';

const Badge = ({ status }) => {
    const map = {
        'Ativo': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        'Ativa': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        'Aprovado': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        'Faturado': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        'Aberto': 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        'Inativo': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        'Pendente': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        'Feito': 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 decoration-line-through border-slate-200 dark:border-slate-700',
        'Separação': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    };
    return (
        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded-sm ${map[status] || 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            {status}
        </span>
    );
};

export default Badge;
