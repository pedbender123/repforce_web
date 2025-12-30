import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { useSysAdminAuth } from '../../context/SysAdminAuthContext';

export default function CompanyList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Auth Hooks for Bridge
    const { login: userLogin, selectTenant } = useAuth();
    const { token: sysAdminToken } = useSysAdminAuth();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data } = await sysAdminApiClient.get('/v1/sysadmin/companies');
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccessCrm = async (company) => {
        try {
            // 1. Setup Pending -> Go to Designer (SysAdmin Area)
            if (company.status === 'setup_pending') {
                navigate(`/sysadmin/companies/${company.id}/design`);
                return;
            }

            // 2. Active -> Go to Tenant Dashboard (Impersonation Bridge)
            await userLogin(sysAdminToken);
            selectTenant(company.slug);
            navigate('/admin/dashboard');

        } catch (error) {
            console.error("Failed to access CRM", error);
            alert("Erro ao acessar ambiente da empresa.");
        }
    };

    const statusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            setup_pending: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800'
        };
        const labels = {
            active: 'Ativo',
            setup_pending: 'Pendente',
            suspended: 'Suspenso'
        };

        const colorClass = colors[status] || 'bg-gray-100 text-gray-800';
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Empresas</h1>
                <button
                    onClick={() => navigate('/sysadmin/companies/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nova Empresa
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center">Carregando...</td></tr>
                        ) : companies.map((company) => (
                            <tr key={company.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {company.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {company.slug}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {statusBadge(company.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {/* Action Button: Edit/Create CRM (Enters Tenant) */}
                                    <button
                                        onClick={() => handleAccessCrm(company)}
                                        className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded transition-colors text-xs uppercase font-bold"
                                    >
                                        {company.status === 'setup_pending' ? 'Setup CRM' : 'Acessar CRM'}
                                    </button>

                                    {/* Edit Global Settings (SysAdmin View) */}
                                    <button
                                        onClick={() => navigate(`/sysadmin/companies/${company.id}`)}
                                        className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors text-xs"
                                    >
                                        Configs
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
