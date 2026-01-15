import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Users, ShoppingCart, FileText,
    CheckSquare, Package, Bell, Truck, Database, Tag,
    Briefcase, Moon, Sun, Archive, User as UserIcon, LogOut, Settings as SettingsIcon
} from 'lucide-react';

import useTabSystem from './hooks/useTabSystem';
import Dashboard from './components/Modules/Dashboard';
import Clients from './components/Modules/Clients';
import Products from './components/Modules/Products';
import Orders from './components/Modules/Orders';
import Quotes from './components/Modules/Quotes';
import Tasks from './components/Modules/Tasks';
import Campaigns from './components/Modules/Campaigns';
import Settings from './components/Settings';
import StandardModule from './components/Shared/StandardModule';
import Login from './components/Login';

// --- CONFIGURAÇÃO DE NAVEGAÇÃO ---
const NAV = {
    vendas: {
        label: 'Vendas', icon: Briefcase,
        pages: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'contas', label: 'Contas', icon: Users },
            { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
            { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
            { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
        ]
    },
    cadastros: {
        label: 'Cadastros', icon: Database,
        pages: [
            { id: 'produtos', label: 'Produtos', icon: Package },
            // { id: 'fretes', label: 'Fretes', icon: Truck }, // Removed as requested
            { id: 'campanhas', label: 'Campanhas', icon: Tag },
        ]
    }
};

// --- SHELL PRINCIPAL ---
export default function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true); // Can stay, but we will hide text near logo. Usually if just image, sidebar can be slim or normal but header has logo.
    // Requirement: "Retire o texto Compasso do lado da Logo! Quarquer texto ali, só a imagem"

    const [activeGroup, setActiveGroup] = useState('vendas');
    const [activePage, setActivePage] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const profileRef = useRef(null);

    // --- ESTADO PERSISTENTE DAS ABAS ---
    const clientsState = useTabSystem();
    const quotesState = useTabSystem();
    const ordersState = useTabSystem();
    const productsState = useTabSystem();
    const campaignsState = useTabSystem();

    // Load User & Theme
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser).user);

        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }

        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };

    const handleGroup = (key) => { setActiveGroup(key); setActivePage(NAV[key].pages[0].id); };

    const renderContent = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'contas': return <Clients tabState={clientsState} />; // Has Add
            case 'produtos': return <Products tabState={productsState} />; // No Add Button (Configured in component default)
            case 'orcamentos': return <Quotes tabState={quotesState} />;
            case 'pedidos': return <Orders tabState={ordersState} />;
            case 'tarefas': return <Tasks />;
            case 'campanhas': return <Campaigns tabState={campaignsState} />;
            case 'settings': return <Settings />;
            default: return <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">Em Desenvolvimento</div>;
        }
    };

    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">

            {/* SIDEBAR */}
            <aside className={`bg-[#1e293b] dark:bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out z-30 shadow-xl border-r border-gray-800 dark:border-slate-800 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
                <div onClick={() => setSidebarOpen(!sidebarOpen)} className="h-14 flex items-center justify-center px-4 border-b border-gray-700 dark:border-slate-800 cursor-pointer hover:bg-gray-800 dark:hover:bg-slate-800 transition-colors">
                    {/* ONLY IMAGE, NO TEXT */}
                    <img src="/logo_clara.png" alt="C" className="h-8 object-contain" />
                </div>
                <div className="flex-1 py-4 px-2 space-y-1">
                    {Object.entries(NAV).map(([key, group]) => (
                        <button
                            key={key}
                            onClick={() => handleGroup(key)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-sm transition-all ${activeGroup === key
                                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <group.icon className="w-5 h-5 min-w-[20px]" />
                            <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                {group.label}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* HEADER */}
                <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800 flex items-end justify-between px-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-20 transition-colors">
                    {/* Page Navigation Tabs */}
                    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full">
                        {activePage === 'settings' ? (
                            <button className="flex items-center gap-2 px-4 h-10 mb-[-1px] text-sm font-bold border-b-2 border-blue-600 text-blue-700 dark:text-blue-400">
                                <SettingsIcon className="w-4 h-4" /> Configurações
                            </button>
                        ) : (
                            NAV[activeGroup].pages.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => setActivePage(page.id)}
                                    className={`group flex items-center gap-2 px-4 h-10 mb-[-1px] text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activePage === page.id
                                            ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <page.icon className="w-4 h-4" />
                                    {page.label}
                                </button>
                            ))
                        )}
                    </nav>

                    {/* Right Header Actions */}
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700 shrink-0 h-8 mb-3">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Notifications */}
                        <div className="relative cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
                        </div>

                        {/* User Profile Popover */}
                        <div className="relative" ref={profileRef}>
                            <div
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-8 h-8 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                            >
                                {user?.name?.charAt(0) || 'U'}
                            </div>

                            {showProfileMenu && (
                                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-sm py-2 z-50 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={() => { setActiveGroup('vendas'); setActivePage('settings'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-2"
                                    >
                                        <SettingsIcon className="w-4 h-4" /> Configurações
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* MAIN VIEW */}
                <main className="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-950 transition-colors">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
} 
