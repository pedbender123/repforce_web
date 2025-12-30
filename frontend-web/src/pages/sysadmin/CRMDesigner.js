import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Table2, Network, Layout } from 'lucide-react';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { useAuth } from '../../context/AuthContext';
import { useSysAdminAuth } from '../../context/SysAdminAuthContext';

// Reuse existing components (Context Switched)
import AdminCustomFields from '../system/AdminCustomFields';
import Webhooks from '../system/Webhooks';
// Future: Area Management

const CRMDesigner = () => {
    const { id } = useParams(); // Company ID
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [activeTab, setActiveTab] = useState('fields');

    // Auth Bridges
    const { login: userLogin, selectTenant } = useAuth();
    const { token: sysAdminToken } = useSysAdminAuth();

    const tabs = [
        { id: 'fields', label: 'Campos Personalizados', icon: <Table2 size={20} /> },
        { id: 'webhooks', label: 'Webhooks & Eventos', icon: <Network size={20} /> },
        // { id: 'areas', label: 'Áreas & Menus', icon: <Layout size={20} /> }, // Future
    ];

    useEffect(() => {
        initializeDesigner();
    }, [id]);

    const initializeDesigner = async () => {
        try {
            // 1. Fetch Company Details (as SysAdmin)
            // We need the SLUG to switch context
            // Does get company list support ID? Or we fetch all and find?
            // companies.py: get /v1/sysadmin/companies returns list.
            // Let's optimize later. For now fetch list.
            const { data } = await sysAdminApiClient.get('/v1/sysadmin/companies');
            const found = data.find(c => c.id === id);

            if (!found) {
                alert("Empresa não encontrada");
                navigate('/sysadmin/companies');
                return;
            }
            setCompany(found);

            // 2. Perform Context Switch (Impersonation)
            // This allows the specialized components (AdminCustomFields) to use 'apiClient' correctly
            if (sysAdminToken) {
                await userLogin(sysAdminToken);
                selectTenant(found.slug);
            }

        } catch (error) {
            console.error("Designer Init Error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando ambiente do cliente...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/sysadmin/companies" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">CRM Designer</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Configurando ambiente: <span className="font-semibold text-blue-600">{company?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md text-sm border border-yellow-200">
                    Modo Designer (SysAdmin Exclusivo)
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'fields' && <AdminCustomFields />}
                    {activeTab === 'webhooks' && <Webhooks />}
                </div>
            </div>
        </div>
    );
};

export default CRMDesigner;
