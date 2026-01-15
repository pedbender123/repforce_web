import React from 'react';

const Sidebar = ({ isOpen, toggle, activeGroup, onSelectGroup, navConfig, onSelectPage }) => {
    return (
        <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out z-30 shadow-2xl ${isOpen ? 'w-64' : 'w-20'}`}>
            <div onClick={toggle} className="h-16 flex items-center justify-center border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                {isOpen ? (
                    <img src="/logo_clara.png" alt="RepForce" className="h-8 object-contain transition-all duration-300" />
                ) : (
                    <img src="/logo_clara.png" alt="R" className="h-8 w-8 object-contain transition-all duration-300" />
                )}
            </div>

            <div className="flex-1 py-6 space-y-6 px-3 overflow-y-auto">
                <div className="space-y-1">
                    <p className={`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Módulos</p>
                    {Object.entries(navConfig).map(([key, group]) => (
                        <button
                            key={key}
                            onClick={() => onSelectGroup(key)}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${activeGroup === key ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <group.icon className="w-5 h-5" />
                            <span className={`text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                {group.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="space-y-1">
                    <p className={`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Páginas</p>
                    {navConfig[activeGroup].pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => onSelectPage(page.id)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
                        >
                            <page.icon className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                            <span className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                {page.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className={`flex items-center gap-3 overflow-hidden transition-all ${isOpen ? 'opacity-100' : 'justify-center'}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 border-2 border-slate-700 shadow-sm flex-shrink-0"></div>
                    <div className={`transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
                        <p className="text-xs font-bold text-white">Pedro Vendedor</p>
                        <p className="text-[10px] text-slate-400">Online</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
