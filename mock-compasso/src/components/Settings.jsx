import React, { useEffect, useState } from 'react';
import { User as UserIcon, Shield, Plus, Save } from 'lucide-react';
import api from '../api';
import StandardModule from './Shared/StandardModule';

const UserForm = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || { name: '', email: '', username: '', password: '', role: 'vendedor' });
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
                    <input type="email" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Usuário</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha</label>
                    <input type="password" placeholder={initialData ? "Deixe em branco p/ manter" : "Livre"} className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cargo</label>
                <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                </select>
            </div>
            <div className="flex justify-end pt-4 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button onClick={() => onSubmit(formData)} className="bg-blue-600 text-white px-6 py-2 rounded-sm text-sm font-bold shadow-lg uppercase tracking-tighter">
                    {initialData ? 'Atualizar Usuário' : 'Salvar Usuário'}
                </button>
            </div>
        </div>
    );
};

const Settings = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [activeTab, setActiveTab] = useState('usuários');

    useEffect(() => {
        loadUsers();
        api.get('/roles').then(res => setRoles(res.data));
    }, []);

    const loadUsers = () => {
        api.get('/users').then(res => setUsers(res.data));
    };

    const handleAddUser = (data) => {
        api.post('/users', data).then(() => loadUsers());
    };

    const handleEditUser = (id, data) => {
        api.put(`/users/${id}`, data).then(() => loadUsers());
    };

    const handleDeleteUser = (id) => {
        api.delete(`/users/${id}`).then(() => loadUsers());
    };

    const renderUserRow = (u) => (
        <>
            <td className="p-3 font-medium text-gray-800 dark:text-white">{u.name}</td>
            <td className="p-3 text-gray-500 dark:text-gray-400">{u.email}</td>
            <td className="p-3 font-mono text-xs">{u.username}</td>
            <td className="p-3 uppercase text-[10px] font-bold tracking-wider">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-sm">{u.role}</span>
            </td>
        </>
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                    <Shield className="w-6 h-6 text-blue-600" /> Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-500 mt-1">Gerencie usuários, cargos e permissões da plataforma.</p>
            </div>

            <div className="flex gap-4 mb-6">
                {['usuários', 'cargos'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'usuários' ? (
                <div className="bg-white dark:bg-gray-900 rounded-sm shadow-sm border border-gray-200 dark:border-gray-800 flex-1 overflow-hidden">
                    <StandardModule
                        title="Usuários"
                        data={users}
                        columns={['Nome', 'E-mail', 'Username', 'Cargo']}
                        newItemLabel="Adicionar Usuário"
                        renderRow={renderUserRow}
                        renderDetail={() => null}
                        onAdd={handleAddUser}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        renderForm={UserForm}
                        tabState={{
                            tabs: [],
                            activeId: 'list',
                            setActiveId: () => { },
                            open: () => { },
                            close: () => { }
                        }}
                    />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-sm shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="font-bold mb-4 dark:text-white">Cargos e Funções</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {roles.map(r => (
                            <div key={r.id} className="p-4 border dark:border-gray-700 rounded-sm">
                                <p className="font-bold text-blue-600">{r.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Permissões padrão de {r.name.toLowerCase()}.</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
