import React, { useEffect, useState } from 'react';
import { User, Shield, Plus, Save } from 'lucide-react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';

const Settings = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/users').then(res => setUsers(res.data));
        api.get('/roles').then(res => setRoles(res.data));
    };

    const handleAddUser = (data) => {
        api.post('/users', data).then(() => {
            loadData();
            // Close modal handled by StandardModule if we used it, 
            // but here we are using a custom view for Settings usually.
            // Actually, let's use StandardModule for Users list!
        });
    };

    // We can use StandardModule for the Users list to keep consistency
    // But Settings usually has a sidebar of its own. 
    // Let's make a simple Tabbed view here since it's "Settings"

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 animate-fade-in">
            {/* Settings Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Configurações</h2>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 p-3 rounded-sm text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <User className="w-4 h-4" /> Usuários
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`w-full flex items-center gap-3 p-3 rounded-sm text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <Shield className="w-4 h-4" /> Cargos
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'users' && (
                    <UsersList users={users} roles={roles} onAdd={handleAddUser} />
                )}
                {activeTab === 'roles' && (
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Cargos</h1>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-300 dark:border-gray-700">
                                    <tr><th className="p-3">ID</th><th className="p-3">Nome</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {roles.map(r => (
                                        <tr key={r.id}>
                                            <td className="p-3 dark:text-gray-300">{r.id}</td>
                                            <td className="p-3 dark:text-gray-300">{r.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const UsersList = ({ users, roles, onAdd }) => {
    const [isFormatOpen, setIsFormatOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'vendedor', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        setIsFormatOpen(false);
        setFormData({ name: '', email: '', role: 'vendedor', password: '' });
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Usuários</h1>
                <button onClick={() => setIsFormatOpen(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Usuário
                </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-300 dark:border-gray-700">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Cargo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 capitalize">{u.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {isFormatOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg shadow-xl p-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Novo Usuário</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                <input required type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input required type="email" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha (Texto Claro)</label>
                                <input required type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
                                <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsFormatOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
