import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import EditableField from '../../components/EditableField';
import { Tab } from '@headlessui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch Product Data
    const { data: product, isLoading, isError } = useQuery(['product', id], async () => {
        const res = await apiClient.get(`/catalog/products/${id}`);
        return res.data;
    });

    // Update Product Mutation
    const updateProductMutation = useMutation((data) => {
        // Need to use FormData because the backend expects it (even if no file)
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        return apiClient.put(`/catalog/products/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries(['product', id]);
            queryClient.invalidateQueries(['products']);
        },
        onError: (err) => alert("Erro ao atualizar produto: " + err.message)
    });

    const handleUpdate = (field, value) => {
        // Simple update wrapper
        updateProductMutation.mutate({ [field]: value });
    };

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando produto...</div>;
    if (isError) return <div className="p-8 text-center text-red-600">Erro ao carregar produto.</div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4">
                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Voltar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna Perfil / Imagem */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-48 object-contain mb-4 rounded" />
                        ) : (
                            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded mb-4">
                                <span className="text-gray-400">Sem Imagem</span>
                            </div>
                        )}
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                <EditableField value={product.name} onSave={(v) => handleUpdate('name', v)} />
                            </h1>
                            <div className="text-sm text-gray-500 mb-4 font-mono">
                                SKU: <EditableField value={product.sku} onSave={(v) => handleUpdate('sku', v)} />
                            </div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                R$ <EditableField value={product.price} type="number" onSave={(v) => handleUpdate('price', v)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">Detalhes Gerais</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Estoque</span>
                                <span className="font-medium dark:text-white">
                                    <EditableField value={product.stock} type="number" onSave={(v) => handleUpdate('stock', v)} />
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Custo (R$)</span>
                                <span className="font-medium dark:text-white">
                                    <EditableField value={product.cost_price} type="number" onSave={(v) => handleUpdate('cost_price', v)} />
                                </span>
                            </div>
                            {product.supplier && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Fornecedor</span>
                                    <span className="font-medium dark:text-white">{product.supplier.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Abas */}
                <div className="lg:col-span-8 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col min-h-[500px]">
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-50 dark:bg-gray-900/50 p-1 border-b border-gray-200 dark:border-gray-700">
                            {['Visão Geral', 'Preços & Regras', 'Histórico Vendas'].map((tab) => (
                                <Tab key={tab} className={({ selected }) =>
                                    classNames('w-full rounded-md py-2.5 text-sm font-medium leading-5 focus:outline-none',
                                        selected ? 'bg-white dark:bg-gray-700 text-repforce-primary shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-white/[0.12]')
                                }>{tab}</Tab>
                            ))}
                        </Tab.List>
                        <Tab.Panels className="p-6 flex-1">
                            <Tab.Panel>
                                <h3 className="text-lg font-medium mb-4 dark:text-white">Descrição / Atributos</h3>
                                <div className="text-gray-600 dark:text-gray-300">
                                    {/* Placeholder for description if we add it to model later */}
                                    <p className="italic text-gray-400">Sem descrição detalhada.</p>

                                    {/* List Custom Attributes if any */}
                                    {product.custom_attributes && Object.keys(product.custom_attributes).length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            {Object.entries(product.custom_attributes).map(([key, val]) => (
                                                <div key={key} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                    <span className="block text-xs text-gray-500 uppercase">{key}</span>
                                                    <span className="font-medium dark:text-white">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="text-center text-gray-500 py-10">Regras de Pricing ativas aparecerão aqui.</div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="text-center text-gray-500 py-10">Histórico de vendas deste produto em breve.</div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </div>
    );
}
