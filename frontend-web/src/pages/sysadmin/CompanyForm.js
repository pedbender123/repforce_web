import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Using same icons as ClientForm likely

// Helper to generate slug
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
};

export default function CompanyForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        admin_name: '',
        admin_email: '', // Needed for user creation
        admin_password: ''
    });

    // Auto-generate slug when name changes
    const handleNameChange = (e) => {
        const name = e.target.value;
        const slug = generateSlug(name);
        setFormData(prev => ({ ...prev, name, slug }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sysAdminApiClient.post('/v1/sysadmin/companies', formData);
            navigate('/sysadmin/companies');
        } catch (error) {
            console.error("Error creating company:", error);
            alert(error.response?.data?.detail || 'Erro ao criar empresa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header / Nav similar to ClientForm */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/sysadmin/companies')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Empresa</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-6 py-6 md:px-8 md:py-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section 1: Dados da Empresa */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Dados da Organização</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nome da Empresa
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleNameChange}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 border"
                                        placeholder="Ex: Comercial Solar Ltda"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Slug (URL do Ambiente)
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                                        https://app.repforce.com/
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Identificador único usado no endereço de acesso. Gerado automaticamente a partir do nome.
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

                    {/* Section 2: Administrador Inicial */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Administrador do Ambiente</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nome do Admin
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        value={formData.admin_name}
                                        onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email de Acesso
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        required
                                        value={formData.admin_email}
                                        onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 border"
                                        placeholder="admin@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Senha Inicial
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="password"
                                        required
                                        value={formData.admin_password}
                                        onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/sysadmin/companies')}
                            className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Criando Ambiente...' : 'Criar Empresa'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
