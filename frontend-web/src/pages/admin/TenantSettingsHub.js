import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Users, Shield, Database, Workflow, Zap, Radio, 
    Settings, Layout, ArrowLeft, Plus, Mail, Pencil, Trash, AlertCircle 
} from 'lucide-react';
import apiClient from '../../api/apiClient';

// Embedded Modules
import DatabaseEditor from '../editor/DatabaseEditor';
import TrailList from '../builder/TrailList';
import TrailBuilder from '../../components/builder/trail/TrailBuilder';
import ActionManager from '../builder/ActionManager';

// ... (imports remain)

// Inline Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-600">
          <h2 className="text-xl font-bold mb-2">Algo deu errado.</h2>
          <pre className="bg-red-50 p-4 rounded text-xs overflow-auto">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default function TenantSettingsHub() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeTab = searchParams.get('tab') || 'users';
    const activeTrailId = searchParams.get('trailId');

    // ... (menuItems unchanged)
    const menuItems = [
        { 
            category: "Administração", 
            items: [
                { id: 'users', label: 'Usuários', icon: Users },
                { id: 'roles', label: 'Perfis de Acesso', icon: Shield },
                { id: 'company', label: 'Dados da Empresa', icon: Settings },
            ]
        },
        { 
            category: "Construtor (Builder)", 
            items: [
                { id: 'database', label: 'Base de Dados', icon: Database },
                { id: 'trails', label: 'Trilhas (Automação)', icon: Workflow },
                { id: 'actions', label: 'Ações / Botões', icon: Zap },
            ]
        }
    ];

    const handleBackToTrails = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('trailId');
        setSearchParams(newParams);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar de Configurações */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 z-20">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <button 
                         onClick={() => navigate('/app')} 
                         className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Voltar ao CRM
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configurações</h2>
                    <p className="text-xs text-gray-500 mt-1">Gestão do Tenant</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {menuItems.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                {group.category}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSearchParams({ tab: item.id })}
                                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                isActive 
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <item.icon size={18} className="mr-3" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <ErrorBoundary>
                    {activeTab === 'users' && (
                         <div className="flex-1 overflow-y-auto p-8"><UsersModule /></div>
                    )}
                    {activeTab === 'roles' && (
                         <div className="flex-1 overflow-y-auto p-8"><RolesModulePlaceholder /></div>
                    )}
                    {activeTab === 'company' && (
                         <div className="flex-1 overflow-y-auto p-8"><CompanyModulePlaceholder /></div>
                    )}

                    {/* Builder Modules */}
                    {activeTab === 'database' && (
                        <div className="flex-1 h-full w-full">
                            <DatabaseEditor />
                        </div>
                    )}
                    {activeTab === 'trails' && (
                        <div className="flex-1 h-full w-full overflow-hidden">
                            {activeTrailId ? (
                                <TrailBuilder 
                                    trailId={activeTrailId} 
                                    onBack={handleBackToTrails}
                                />
                            ) : (
                                <div className="h-full overflow-y-auto p-4 md:p-8">
                                    <TrailList 
                                        onSelectTrail={(trail) => setSearchParams({ tab: 'trails', trailId: trail.id })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'actions' && (
                        <div className="flex-1 h-full w-full overflow-hidden">
                            <ActionManager />
                        </div>
                    )}
                </ErrorBoundary>
            </main>
        </div>
    );
}

// --- SUB-MODULES ---

const UsersModule = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        apiClient.get('/admin/users')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setUsers(res.data);
                } else {
                    console.error("API /admin/users returned non-array:", res.data);
                    setUsers([]);
                    setError("Formato de dados inválido.");
                }
            })
            .catch(err => {
                console.error(err);
                setError(err.message || "Erro ao carregar usuários.");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
                    <p className="text-gray-500 text-sm">Gerencie quem tem acesso ao sistema.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                    <Plus size={16} className="mr-2" /> Novo Usuário
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando...</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nome</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Perfil</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.full_name || u.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                                            {u.role?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const RolesModulePlaceholder = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
        <Shield size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Perfis de Acesso</h3>
        <p className="text-gray-500 mt-2">Módulo em construção. Aqui você poderá definir permissões granulares.</p>
    </div>
);

const CompanyModulePlaceholder = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
        <Settings size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dados da Empresa</h3>
        <p className="text-gray-500 mt-2">Edite logotipo, nome e configurações regionais.</p>
    </div>
);
