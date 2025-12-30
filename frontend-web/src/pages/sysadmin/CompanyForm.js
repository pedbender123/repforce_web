import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Helper to generate slug
const generateSlug = (text) => {
    if (!text) return '';
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
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        status: 'active',
        admin_name: '',
        admin_email: '',
        admin_password: ''
    });

    useEffect(() => {
        if (isEditMode) {
            fetchCompanyData();
        }
    }, [id]);

    const fetchCompanyData = async () => {
        try {
            // Reusing list endpoint since we don't have get-by-id strictly defined publicly yet? 
            // Wait, we just added PATCH by ID. We usually need a GET by ID or filter on list.
            // Let's filter on the client side since list is small? 
            // Better: List endpoint returns all. We filter here.

            const { data } = await sysAdminApiClient.get('/v1/sysadmin/companies');
            const found = data.find(c => c.id === id);

            if (found) {
                setFormData({
                    name: found.name,
                    slug: found.slug,
                    status: found.status,
                    admin_name: '', // Don't show admin details on edit
                    admin_email: '',
                    admin_password: ''
                });
            } else {
                alert("Empresa não encontrada");
                navigate('/sysadmin/companies');
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setInitialLoading(false);
        }
    };

    // Generic Change Handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-generate slug if editing Name AND NOT in edit mode (slug is locked in edit)
            if (name === 'name' && !isEditMode) {
                newData.slug = generateSlug(value);
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                // UPDATE
                await sysAdminApiClient.patch(`/v1/sysadmin/companies/${id}`, {
                    name: formData.name,
                    status: formData.status
                });
            } else {
                // CREATE
                await sysAdminApiClient.post('/v1/sysadmin/companies', formData);
            }
            navigate('/sysadmin/companies');
        } catch (error) {
            console.error("Error saving company:", error);
            alert(error.response?.data?.detail || 'Erro ao salvar empresa.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/sysadmin/companies')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    type="button"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditMode ? 'Editar Empresa' : 'Nova Empresa'}
                </h1>
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
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
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
                                        {window.location.origin}/app/
                                    </span>
                                    <input
                                        type="text"
                                        name="slug"
                                        required
                                        disabled={isEditMode} // Disable slug editing
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border 
                                            ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500'}
                                            border-gray-300 dark:border-gray-600 dark:text-white`}
                                    />
                                </div>
                                {!isEditMode && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Endereço final: {window.location.origin}/app/{formData.slug || 'slug'}
                                    </p>
                                )}
                            </div>

                            {isEditMode && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="suspended">Suspenso</option>
                                        <option value="setup_pending">Pendente</option>
                                    </select>
                                </div>
                            )}

                        </div>
                    </div>

                    {!isEditMode && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

                            {/* Section 2: Administrador Inicial (Only for Creation) */}
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
                                                name="admin_name"
                                                required
                                                value={formData.admin_name}
                                                onChange={handleChange}
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
                                                name="admin_email"
                                                required
                                                value={formData.admin_email}
                                                onChange={handleChange}
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
                                                name="admin_password"
                                                required
                                                value={formData.admin_password}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2.5 border"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}

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
                            {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Empresa')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
