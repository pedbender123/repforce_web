import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
    LogOut,
    LayoutDashboard,
    ShoppingCart,
    Users,
    Menu,
    X,
    Sun,
    Moon,
    Map,
    Package,
    Settings,
    Briefcase,
    Phone,
    ShieldAlert,
    Database,
    Layout,
    Server
} from 'lucide-react';
// Adjusted Imports for Layouts directory
import ProvisioningScreen from '../components/ProvisioningScreen';
import TopHeaderActions from '../components/TopHeaderActions'; // FIXED: Unified Header
import DemoModeBanner from '../components/DemoModeBanner';

// import { useBuilder } from '../context/BuilderContext'; // Import Context
import DynamicSidebar from '../components/navigation/DynamicSidebar';
import apiClient from '../api/apiClient';
import NavigationPageModal from '../components/builder/NavigationPageModal';
import { Plus } from 'lucide-react';
import TabManager from '../components/navigation/TabManager';

// ... imports ...

const CrmLayout = () => {
    const { user, userProfile, isSysAdmin, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    // const { isEditMode } = useBuilder(); // Builder Context Removed
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Dynamic Navigation State
    const [navGroups, setNavGroups] = useState([]);
    const [isAddPageOpen, setIsAddPageOpen] = useState(false);

    // Fetch Navigation
    const fetchNavigation = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            console.log("Navigation Data:", data);
            if (Array.isArray(data)) {
                setNavGroups(data);
            } else {
                console.warn("Navigation API returned non-array:", data);
                setNavGroups([]);
            }
        } catch (error) {
            console.error("Failed to load navigation", error);
            setNavGroups([]);
        }
    };

    useEffect(() => {
        fetchNavigation();

        // Listen for updates from Builder
        const handleUpdate = () => fetchNavigation();
        window.addEventListener('navigation-updated', handleUpdate);

        return () => window.removeEventListener('navigation-updated', handleUpdate);
    }, []);

    // Mapeamento de Ícones
    const iconMap = {
        'LayoutDashboard': <LayoutDashboard size={20} />,
        'Users': <Users size={20} />,
        'ShoppingCart': <ShoppingCart size={20} />,
        'Map': <Map size={20} />,
        'Package': <Package size={20} />,
        'Settings': <Settings size={20} />,
        'Briefcase': <Briefcase size={20} />,
        'Phone': <Phone size={20} />,
        'ShieldAlert': <ShieldAlert size={20} />,
        'Server': <Server size={20} />,
        'Database': <Database size={20} />,
        'Layout': <Layout size={20} />
    };

    const builderArea = {
        id: 'builder_core',
        name: 'Construtor',
        icon: 'Database',
        pages_json: [
            { label: 'Base de Dados', path: '/app/editor/database' },
            { label: 'Automações (Trilhas)', path: '/app/editor/trails' },
            { label: 'Gestão de Botões', path: '/app/editor/actions' },
            { label: 'Webhooks (Saída)', path: '/app/editor/workflows' }
        ]
    };

    // LÓGICA DE COMPOSIÇÃO DE ÁREAS
    let userAreas = [];
    const dynamicAreas = user?.role_obj?.areas || [];

    // Mapear NavGroups do Builder para o formato de "Area"
    const builderAreas = (Array.isArray(navGroups) ? navGroups : []).map(g => {
        // Resolve Tenant Slug (fallback to context)
        // If we are in "app/:tenantId/...", we could parse it, but user.tenant is reliable
        const tenantSlug = user?.tenant?.slug || 'default';

        return {
            id: g.id,
            name: g.name,
            icon: g.icon,
            is_dynamic: true, // Flag to identify mutable areas
            pages_json: g.pages.map(p => ({
                id: p.id, // Keep ID for reference
                label: p.name,
                // Changed to Absolute Path: /app/:tenant/:group/:page
                // RedirectWrapper will handle the subpage
                path: `/app/${tenantSlug}/${g.id}/${p.id}`
            }))
        };
    });

    // Se Modo Edição -> Injeta Builder no fim (ou no topo)
    // REMOVIDO: O Construtor agora fica na área de Configurações (Separado)
    // if (isEditMode) {
    //    userAreas.push(builderArea);
    // }

    // Auto-enable Edit Mode for SysAdmin if needed? No, let them toggle.

    // Adiciona áreas dinâmicas do usuário E do Builder
    userAreas = [...userAreas, ...dynamicAreas, ...builderAreas];


    // Remove duplicatas por ID
    userAreas = userAreas.filter((area, index, self) =>
        index === self.findIndex((t) => (t.id === area.id))
    );

    // Estado da Área Ativa
    const [activeArea, setActiveArea] = useState(userAreas.length > 0 ? userAreas[0] : null);

    // Auto-select area based on URL
    // We can also use useParams();
    const params = useParams(); // Need to import useParams in component or use logic

    useEffect(() => {
        if (userAreas.length > 0) {
            let foundArea = null;

            // Priority 1: Check by GroupId in URL
            if (params.groupId) {
                foundArea = userAreas.find(a => a.id === params.groupId);
            }
            // Priority 2: Check by PageId (Legacy or Direct match)
            else if (params.pageId) {
                foundArea = userAreas.find(a => a.pages_json?.some(p => p.id === params.pageId));
            }
            // Priority 3: Path Prefix (Legacy)
            if (!foundArea) {
                foundArea = userAreas.find(area =>
                    (area.is_dynamic && location.pathname.startsWith(`/app/group/${area.id}`)) ||
                    area.pages_json?.some(page => location.pathname.startsWith(page.path))
                );
            }

            if (foundArea) {
                if (foundArea.id !== activeArea?.id) setActiveArea(foundArea);
            } else if (!activeArea) {
                setActiveArea(userAreas[0]);
            }
        }
    }, [location.pathname, userAreas, activeArea, params.groupId, params.pageId]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderIcon = (iconName) => iconMap[iconName] || <Briefcase size={20} />;

    if (user?.tenant?.status === 'provisioning' && !isSysAdmin) {
        return <ProvisioningScreen />;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

            {/* --- SIDEBAR: ÁREAS DO TENANT --- */}
            <aside
                className={`hidden md:flex flex-col bg-gray-900 dark:bg-black border-r border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <div
                    className="h-16 flex items-center justify-center border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <img src="/logo_clara.png" alt="RepForce" className="h-8 w-auto object-contain" />
                </div>

                {/* DYNAMIC SIDEBAR (Replaces Static Areas) */}
                <DynamicSidebar
                    isCollapsed={isCollapsed}
                    groups={navGroups}
                    onRefresh={fetchNavigation}
                />

                {/* Footer Fixed: Configurações - MOVIDO PARA HEADER */}
                {/* <div className="p-2 border-t border-gray-800"> ... </div> */}

                <div className="p-4 border-t border-gray-800 flex justify-center">
                    <span className="text-xs text-gray-600">v2.0 (Hardened)</span>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* DEMO BANNER */}
                <DemoModeBanner />

                {/* --- HEADER MOBILE --- */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <img src="/logo_clara.png" alt="RepForce" className="h-6 mr-2 object-contain" />
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* --- MENU SUPERIOR (TABS DA ÁREA ATIVA) --- */}
                <div className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-0 items-center h-12 shadow-sm z-40">
                    <div className="flex items-end h-full overflow-x-auto mr-auto">
                        {activeArea?.pages_json?.map((page) => {
                            const isPageActive = location.pathname.startsWith(page.path);
                            return (
                                <Link
                                    key={page.path}
                                    to={page.path}
                                    className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isPageActive
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {page.label}
                                </Link>
                            );
                        })}

                        {/* Builder: Add Page Button */}

                    </div>

                    {/* Right Actions Section (NEW) */}
                    <TopHeaderActions />
                </div>

                {/* MDI TAB MANAGER */}
                <TabManager />

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700 shadow-lg">
                        <nav className="p-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Área: {activeArea?.name}</p>
                            <ul className="space-y-2">
                                {activeArea?.pages_json?.map((page) => (
                                    <li key={page.path}>
                                        <Link
                                            to={page.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${location.pathname.startsWith(page.path)
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {page.label}
                                        </Link>
                                    </li>
                                ))}
                                {/* Seletor de Área Mobile */}
                                <li className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Trocar Área</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {userAreas.map(area => (
                                            <button
                                                key={area.id}
                                                onClick={() => { setActiveArea(area); setIsMobileMenuOpen(false); if (area.pages_json?.[0]) navigate(area.pages_json[0].path); }}
                                                className={`px-3 py-1 text-xs border rounded transition-colors whitespace-nowrap ${activeArea?.id === area.id
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'dark:text-white dark:border-gray-600'
                                                    }`}
                                            >
                                                {area.name}
                                            </button>
                                        ))}
                                    </div>
                                </li>
                                <li className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        {theme === 'dark' ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                                        Tema
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400"
                                    >
                                        <LogOut size={18} className="mr-3" />
                                        Sair
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-2 md:p-3 bg-gray-50 dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
            <NavigationPageModal
                isOpen={isAddPageOpen}
                onClose={() => setIsAddPageOpen(false)}
                groupId={activeArea?.id}
                onPageCreated={fetchNavigation}
            />
        </div>
    );
};

export default CrmLayout;
