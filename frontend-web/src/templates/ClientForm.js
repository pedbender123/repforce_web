import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ClientForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation((data) => apiClient.post('/crm/clients', data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      alert('Cliente cadastrado com sucesso!');
      navigate('/app/clients');
    },
    onError: (err) => alert(`Erro: ${err.response?.data?.detail || err.message}`)
  });

  const onSubmit = (data) => {
    const payload = {
        name: data.name,
        trade_name: data.trade_name,
        email: data.email,
        document: data.cnpj,
        address_json: { 
            rua: data.rua,
            numero: data.numero,
            bairro: data.bairro,
            cidade: data.cidade,
            uf: data.uf,
            cep: data.cep
        }
    };
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => navigate('/app/clients')} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-1"/> Voltar para Lista
      </button>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-2 dark:border-gray-700">
            Cadastrar Novo Cliente
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razão Social *</label>
                    <input {...register("name", { required: "Obrigatório" })} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Fantasia</label>
                    <input {...register("trade_name")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ / Documento</label>
                    <input {...register("cnpj")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input {...register("email")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CEP</label>
                    <input {...register("cep")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                    <input {...register("cidade")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">UF</label>
                    <input {...register("uf")} maxLength="2" className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                
                <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rua / Logradouro</label>
                    <input {...register("rua")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número</label>
                    <input {...register("numero")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bairro</label>
                    <input {...register("bairro")} className="mt-1 w-full rounded border p-2 dark:bg-gray-700 dark:text-white"/>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => navigate('/app/clients')} className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">Cancelar</button>
                <button type="submit" disabled={mutation.isLoading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    {mutation.isLoading ? 'Salvando...' : 'Cadastrar Cliente'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}