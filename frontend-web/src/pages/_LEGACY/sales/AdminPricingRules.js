import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const RULE_TYPES = [
    { value: 'quantity', label: 'Quantidade Mínima' },
    { value: 'value', label: 'Valor Mínimo' },
    { value: 'seasonal', label: 'Sazonal (Datas)' }
];

const TARGET_TYPES = [
    { value: 'global', label: 'Global (Todo Pedido)' },
    { value: 'brand', label: 'Marca Específica' },
    { value: 'family', label: 'Família de Produtos' },
    { value: 'product', label: 'Produto Específico' }
];

export default function AdminPricingRules() {
    const [isCreating, setIsCreating] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        type: 'quantity',
        target_type: 'global',
        target_id: '',
        min_quantity: '',
        min_value: '',
        discount_percent: '',
        discount_value: '',
        start_date: '',
        end_date: '',
        priority: 0
    });

    const queryClient = useQueryClient();

    const { data: rules, isLoading } = useQuery(['discountRules'], async () => {
        const res = await apiClient.get('/crm/config/rules');
        return res.data;
    });

    // Fetches aux para selects (Brand, Family, Product) se target_type != global
    // Simplificação: Fazer fetch on demand ou carregar tudo se for pequeno.

    const createMutation = useMutation(async (ruleData) => {
        // Conversão de tipos
        const payload = {
            ...ruleData,
            min_quantity: ruleData.min_quantity ? parseInt(ruleData.min_quantity) : null,
            min_value: ruleData.min_value ? parseFloat(ruleData.min_value) : null,
            discount_percent: ruleData.discount_percent ? parseFloat(ruleData.discount_percent) : null,
            discount_value: ruleData.discount_value ? parseFloat(ruleData.discount_value) : null,
            target_id: ruleData.target_id ? parseInt(ruleData.target_id) : null,
            priority: parseInt(ruleData.priority || 0),
            start_date: ruleData.start_date || null,
            end_date: ruleData.end_date || null
        };
        await apiClient.post('/crm/config/rules', payload);
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries(['discountRules']);
            setIsCreating(false);
            setNewRule({
                name: '', type: 'quantity', target_type: 'global', target_id: '',
                min_quantity: '', min_value: '', discount_percent: '', discount_value: '',
                start_date: '', end_date: '', priority: 0
            });
        },
        onError: (err) => alert("Erro ao criar regra: " + (err.response?.data?.detail || err.message))
    });

    const deleteMutation = useMutation(async (id) => {
        await apiClient.delete(`/crm/config/rules/${id}`);
    }, {
        onSuccess: () => queryClient.invalidateQueries(['discountRules'])
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(newRule);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Regras de Preço e Descontos</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Nova Regra
                </button>
            </div>

            {isCreating && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8 border dark:border-gray-700 shadow-sm">
                    <h3 className="font-semibold mb-4 text-lg dark:text-white">Criar Nova Regra</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm mb-1 dark:text-gray-300">Nome da Regra</label>
                            <input
                                required
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.name}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                placeholder="Ex: Promoção de Verão"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Tipo de Regra</label>
                            <select
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.type}
                                onChange={e => setNewRule({ ...newRule, type: e.target.value })}
                            >
                                {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Escopo (Target)</label>
                            <select
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.target_type}
                                onChange={e => setNewRule({ ...newRule, target_type: e.target.value })}
                            >
                                {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        {newRule.target_type !== 'global' && (
                            <div>
                                <label className="block text-sm mb-1 dark:text-gray-300">ID do Alvo</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                    value={newRule.target_id}
                                    onChange={e => setNewRule({ ...newRule, target_id: e.target.value })}
                                    placeholder={`ID do ${newRule.target_type}`}
                                />
                            </div>
                        )}

                        <div className="border-t col-span-full my-2"></div>

                        {newRule.type === 'quantity' && (
                            <div>
                                <label className="block text-sm mb-1 dark:text-gray-300">Qtd. Mínima</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                    value={newRule.min_quantity}
                                    onChange={e => setNewRule({ ...newRule, min_quantity: e.target.value })}
                                />
                            </div>
                        )}

                        {newRule.type === 'value' && (
                            <div>
                                <label className="block text-sm mb-1 dark:text-gray-300">Valor Mínimo (R$)</label>
                                <input
                                    type="number" step="0.01"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                    value={newRule.min_value}
                                    onChange={e => setNewRule({ ...newRule, min_value: e.target.value })}
                                />
                            </div>
                        )}

                        {(newRule.type === 'seasonal' || true) && (
                            <>
                                <div>
                                    <label className="block text-sm mb-1 dark:text-gray-300">Data Início</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                        value={newRule.start_date}
                                        onChange={e => setNewRule({ ...newRule, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 dark:text-gray-300">Data Fim</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                        value={newRule.end_date}
                                        onChange={e => setNewRule({ ...newRule, end_date: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="border-t col-span-full my-2"></div>

                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Desconto (%)</label>
                            <input
                                type="number" step="0.1"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.discount_percent}
                                onChange={e => setNewRule({ ...newRule, discount_percent: e.target.value })}
                                placeholder="Ex: 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Desconto Valor Fixo (R$)</label>
                            <input
                                type="number" step="0.01"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.discount_value}
                                onChange={e => setNewRule({ ...newRule, discount_value: e.target.value })}
                                placeholder="Ex: 50.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Prioridade</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRule.priority}
                                onChange={e => setNewRule({ ...newRule, priority: e.target.value })}
                                placeholder="Maior = Mais prioridade"
                            />
                        </div>

                        <div className="col-span-full flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Salvar Regra
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escopo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desconto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center dark:text-gray-400">Carregando...</td></tr>
                        ) : rules?.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center dark:text-gray-400">Nenhuma regra ativa.</td></tr>
                        ) : (
                            rules?.map(rule => (
                                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 text-sm text-gray-500 font-bold">{rule.priority}</td>
                                    <td className="px-6 py-4 text-sm font-medium dark:text-white">
                                        {rule.name}
                                        {rule.active === false && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Inativo</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{rule.type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{rule.target_type} {rule.target_id && `(#${rule.target_id})`}</td>
                                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                                        {rule.discount_percent ? `${rule.discount_percent}%` : `R$ ${rule.discount_value}`}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Remover regra?')) deleteMutation.mutate(rule.id);
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
