import React, { useEffect, useState } from 'react';
import { Truck, CreditCard, Save } from 'lucide-react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import MasterDetailView from '../Shared/MasterDetailView';
import Badge from '../Shared/Badge';

const ClientForm = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || {
        razao_social: '',
        fantasy_name: '',
        cnpj: '',
        activity_branch: 'Varejo',
        address_full: '',
        abc_class: 'C',
        credit_limit: 5000
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Razão Social (Fábrica/Loja)</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome Fantasia</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.fantasy_name} onChange={e => setFormData({ ...formData, fantasy_name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CNPJ</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ramo de Atividade</label>
                    <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.activity_branch} onChange={e => setFormData({ ...formData, activity_branch: e.target.value })}>
                        <option value="Varejo">Varejo Moveleiro</option>
                        <option value="Atacado">Atacado</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Decor">Design/Decor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Classe ABC</label>
                    <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.abc_class} onChange={e => setFormData({ ...formData, abc_class: e.target.value })}>
                        <option value="A">Classe A (Alta)</option>
                        <option value="B">Classe B (Média)</option>
                        <option value="C">Classe C (Baixa)</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Endereço Completo</label>
                <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.address_all || formData.address_full} onChange={e => setFormData({ ...formData, address_full: e.target.value })} />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Limite de Crédito (R$)</label>
                <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: e.target.value })} />
            </div>
            <div className="flex justify-end pt-4 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button onClick={() => onSubmit(formData)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-sm text-sm font-black uppercase shadow-lg transition-all active:scale-95 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {initialData ? 'Salvar Alterações' : 'Cadastrar Lojista'}
                </button>
            </div>
        </div>
    );
};

const Clients = ({ tabState }) => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/clients')
            .then(res => setClients(res.data))
            .catch(err => console.error("Error loading clients", err));
    };

    const handleAdd = (data) => {
        api.post('/clients', data).then(() => loadData());
    };

    const handleEdit = (id, data) => {
        api.put(`/clients/${id}`, data).then(() => loadData());
    };

    const handleDelete = (id) => {
        api.delete(`/clients/${id}`).then(() => loadData());
    };

    const renderRow = (c) => (
        <>
            <td className="p-3 font-medium text-blue-700 dark:text-blue-400">{c.razao_social || c.name}</td>
            <td className="p-3 text-[10px] font-mono text-gray-500 dark:text-gray-400">{c.cnpj}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{c.activity_branch}</td>
            <td className="p-3"><Badge status={c.status} /></td>
        </>
    );

    const renderDetail = (c) => (
        <MasterDetailView
            item={c}
            summary={(i) => (
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-blue-700 rounded-sm flex items-center justify-center text-white text-xl font-bold shadow-sm">
                            {(i.razao_social || i.name || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{i.razao_social || i.name}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">Lojista Moveleiro • Classe {i.abc_class}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-sm border border-gray-200 dark:border-gray-700 shadow-sm space-y-2 text-sm">
                        <div><span className="text-[10px] font-black text-gray-400 block uppercase">Razão Social</span><span className="dark:text-gray-300">{i.razao_social}</span></div>
                        <div><span className="text-[10px] font-black text-gray-400 block uppercase">Nome Fantasia</span><span className="dark:text-gray-300">{i.fantasy_name}</span></div>
                        <div><span className="text-[10px] font-black text-gray-400 block uppercase">CNPJ</span><span className="dark:text-gray-300">{i.cnpj}</span></div>
                        <div><span className="text-[10px] font-black text-gray-400 block uppercase">Endereço</span><span className="dark:text-gray-300">{i.address}</span></div>
                    </div>
                </div>
            )}
            tabs={[
                {
                    label: 'Visão 360',
                    content: (i) => (
                        <div className="grid grid-cols-2 gap-6 p-4">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-gray-50 dark:bg-gray-800/20">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 text-xs">
                                    <Truck className="w-4 h-4" /> Logística
                                </h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-300">Frete CIF padrão para o ramo de {i.activity_branch}.</p>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-white dark:bg-gray-900">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 text-xs">
                                    <CreditCard className="w-4 h-4" /> Limite de Crédito
                                </h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="dark:text-gray-400">Utilizado</span>
                                        <span className="font-bold text-blue-600">R$ {i.credit_used?.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full">
                                        <div className="bg-blue-600 h-full" style={{ width: `${(i.credit_used / i.credit_limit) * 100}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-right">Teto: R$ {i.credit_limit?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]}
        />
    );

    return (
        <StandardModule
            title="Lojistas"
            data={clients}
            newItemLabel="Novo Lojista"
            columns={['Razão Social', 'CNPJ', 'Ramo', 'Status']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            renderForm={ClientForm}
        />
    );
};

export default Clients;
