import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { PlusIcon, TrashIcon, ArrowLeftIcon, PencilIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'; // Using outline for consistency
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Still needed for Access CRM override
import ErrorDialog from '../../../components/ui/ErrorDialog';

// --- UTILS ---
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

// --- SUB-COMPONENTS ---

const TenantList = ({ onEdit, onCreate }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { login: userLogin, selectTenant, token: sysAdminToken } = useAuth();
    const [errorModal, setErrorModal] = useState({ open: false, message: '' });

    const showError = (msg) => {
        const detail = msg?.response?.data?.detail || msg?.message || JSON.stringify(msg);
        setErrorModal({ open: true, message: typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail });
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data } = await apiClient.get('/v1/sysadmin/companies');
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccessCrm = async (company) => {
        try {
            if (company.status === 'setup_pending') {
                // If designer is inside SysAdmin, maybe switch tab or route?
                // For now, keep route behavior for Designer if it's external to Hub
                navigate(`/sysadmin/companies/${company.id}/design`);
                return;
            }
            await userLogin(sysAdminToken);
            selectTenant(company.slug);
            navigate('/admin/dashboard');
        } catch (error) {
            console.error("Failed to access CRM", error);
            showError(error);
        }
    };

    const deleteCompany = async (company) => {
        const confirmName = window.prompt(`ATENÇÃO: Ação Destrutiva!\n\nIsso apagará TODO o banco de dados da empresa "${company.name}" e não pode ser desfeito.\n\nDigite o nome da empresa para confirmar:`);
        if (confirmName !== company.name) {
            if (confirmName !== null) alert("Nome incorreto. Operação cancelada.");
            return;
        }

        try {
            await apiClient.delete(`/v1/sysadmin/companies/${company.id}`);
            alert("Empresa excluída com sucesso.");
            fetchCompanies();
        } catch (error) {
            console.error("Failed to delete company", error);
            showError(error);
        }
    };

    const createTemplate = async (company) => {
        const name = window.prompt(`Criar Modelo a partir de "${company.name}"?\n\nDigite o nome do novo modelo:`);
        if (!name) return;

        try {
            await apiClient.post('/v1/sysadmin/templates/from_tenant', {
                tenant_id: company.id,
                name: name,
                description: `Gerado a partir de ${company.name}`
            });
            alert("Modelo criado com sucesso!");
        } catch (error) {
            console.error("Failed to create template", error);
            showError(error);
        }
    };

    const statusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            setup_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
        const labels = { active: 'Ativo', setup_pending: 'Pendente', suspended: 'Suspenso' };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Empresas (Tenants)</h3>
                <button
                    onClick={onCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nova Empresa
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
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
                        {companies.map((company) => (
                            <tr key={company.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{company.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{company.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{statusBadge(company.status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleAccessCrm(company)}
                                        className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded transition-colors text-xs uppercase font-bold"
                                    >
                                        {company.status === 'setup_pending' ? 'Setup' : 'Acessar'}
                                    </button>
                                    <button
                                        onClick={() => onEdit(company)}
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-2 py-1"
                                        title="Editar Config"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCompany(company)}
                                        className="text-red-400 hover:text-red-700 px-2 py-1"
                                        title="Excluir"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => createTemplate(company)}
                                        className="text-blue-400 hover:text-blue-700 px-2 py-1"
                                        title="Criar Modelo (Snapshot)"
                                    >
                                        <DocumentDuplicateIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TenantForm = ({ companyToEdit, onCancel, onSuccess }) => {
    const isEditMode = !!companyToEdit;
    const [loading, setLoading] = useState(false);
    const [errorModal, setErrorModal] = useState({ open: false, message: '' });
    
    const showError = (msg) => {
        const detail = msg?.response?.data?.detail || msg?.message || JSON.stringify(msg);
        setErrorModal({ open: true, message: typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail });
    };

    const [formData, setFormData] = useState({
        name: companyToEdit?.name || '',
        slug: companyToEdit?.slug || '',
        status: companyToEdit?.status || 'active',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        is_blank: false,
        template_id: ''
    });

    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        if (!isEditMode) {
            apiClient.get('/v1/sysadmin/templates')
                .then(res => setTemplates(res.data))
                .catch(err => console.error("Error loading templates", err));
        }
    }, [isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const val = type === 'checkbox' ? checked : value;
            const newData = { ...prev, [name]: val };
            if (name === 'name' && !isEditMode) {
                newData.slug = generateSlug(value);
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting form...", formData);
        setLoading(true);
        try {
            if (isEditMode) {
                await apiClient.patch(`/v1/sysadmin/companies/${companyToEdit.id}`, {
                    name: formData.name,
                    status: formData.status
                });
            } else {
                await apiClient.post('/v1/sysadmin/companies', {
                    ...formData,
                    template_id: formData.template_id || null // Ensure null if empty
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving company:", error);
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                 <button onClick={onCancel} className="mr-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
                 </button>
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {isEditMode ? 'Editar Empresa' : 'Nova Empresa'}
                 </h3>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Dados da Organização</h4>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Empresa</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                                        /app/
                                    </span>
                                    <input type="text" name="slug" required disabled={isEditMode} value={formData.slug} onChange={handleChange}
                                        className={`flex-1 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border ${isEditMode ? 'bg-gray-100' : 'bg-white dark:bg-gray-700'} border-gray-300 dark:border-gray-600 dark:text-white`} />
                                </div>
                            </div>
                             {isEditMode && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white dark:border-gray-600">
                                        <option value="active">Ativo</option>
                                        <option value="suspended">Suspenso</option>
                                        <option value="setup_pending">Pendente</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        {!isEditMode && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                             <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Inicialização do Sistema</h5>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <input
                                        id="is_blank"
                                        name="is_blank"
                                        type="checkbox"
                                        checked={formData.is_blank}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_blank" className="ml-2 block text-sm text-gray-900 dark:text-white">
                                        Iniciar em Branco (Sem Template)
                                    </label>
                                </div>

                                {!formData.is_blank && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo Inicial</label>
                                        <select
                                            name="template_id"
                                            value={formData.template_id}
                                            onChange={handleChange}
                                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white dark:border-gray-600"
                                        >
                                            <option value="">Padrão (CRM V1)</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                             </div>
                        </div>
                        )}
                     </div>

                     {!isEditMode && (
                        <div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-4"></div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Administrador Inicial</h4>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                                    <input type="text" name="admin_name" required value={formData.admin_name} onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm sm:text-sm p-2 border" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input type="email" name="admin_email" required value={formData.admin_email} onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm sm:text-sm p-2 border" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                                    <input type="password" name="admin_password" required value={formData.admin_password} onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm sm:text-sm p-2 border" />
                                </div>
                            </div>
                        </div>
                     )}

                     <div className="flex justify-end pt-5">
                        <button type="button" onClick={onCancel} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                     </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN FACTORY COMPONENT ---

export default function TenantManagement() {
    const [view, setView] = useState('list'); // list, create, edit
    const [selectedCompany, setSelectedCompany] = useState(null);

    return (
        <div>
            {view === 'list' && (
                <TenantList 
                    onCreate={() => { setSelectedCompany(null); setView('create'); }}
                    onEdit={(company) => { setSelectedCompany(company); setView('edit'); }}
                />
            )}
            {(view === 'create' || view === 'edit') && (
                <TenantForm 
                    companyToEdit={selectedCompany} 
                    onCancel={() => setView('list')} 
                    onSuccess={() => setView('list')}
                />
            )}
        </div>
    );
}
