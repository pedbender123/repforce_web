import React, { useEffect, useState } from 'react';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function CompanyList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const statusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            setup_pending: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800'
        };
        const colorClass = colors[status] || 'bg-gray-100 text-gray-800';
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                {status}
            </span>
        );
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', admin_name: '', admin_password: '' });
    const [createLoading, setCreateLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            // Using /v1/sysadmin/companies endpoint
            await sysAdminApiClient.post('/v1/sysadmin/companies', formData);
            setIsModalOpen(false);
            fetchCompanies();
            // Optional: reset form
            setFormData({ name: '', slug: '', admin_name: '', admin_password: '' });
        } catch (error) {
            alert('Erro ao criar empresa check console');
            console.error(error);
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Empresas</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nova Empresa
                </button>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Nova Empresa</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Empresa</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug (URL)</label>
                                <input required type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Nome</label>
                                <input required type="text" value={formData.admin_name} onChange={e => setFormData({ ...formData, admin_name: e.target.value })} className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha Admin</label>
                                <input required type="password" value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                                <button type="submit" disabled={createLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                    {createLoading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 transition-colors">
                                        Editar CRM
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
