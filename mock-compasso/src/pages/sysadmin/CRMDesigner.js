import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Table2, Network, Layout } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

import DatabaseEditor from '../editor/DatabaseEditor';

const CRMDesigner = () => {
    const { id } = useParams(); // Company ID
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);

    // Auth Bridges
    const { login: userLogin, selectTenant } = useAuth();
    const { token: sysAdminToken, isLoadingAuth: isSysAdminLoading } = useAuth();

    useEffect(() => {
        if (!isSysAdminLoading) {
            initializeDesigner();
        }
    }, [id, isSysAdminLoading]);

    const initializeDesigner = async () => {
        try {
            const { data } = await apiClient.get('/v1/sysadmin/companies');
            const found = data.find(c => c.id === id);

            if (!found) {
                alert("Empresa não encontrada");
                navigate('/sysadmin/config');
                return;
            }
            setCompany(found);

            // 2. Perform Context Switch (Impersonation)
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

    if (loading || isSysAdminLoading) {
        return (
             <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Preparando ambiente do cliente...</p>
                </div>
             </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Construtor de CRM</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Editando: <span className="font-semibold text-blue-600">{company?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    <Layout size={14} />
                    MODO DESIGNER ATIVO
                </div>
            </div>

            {/* Content Area - Rendering the Universal Generic Editor */}
            <div className="flex-1 overflow-hidden">
                <DatabaseEditor />
            </div>
        </div>
    );
};

export default CRMDesigner;
