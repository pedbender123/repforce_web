
import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import apiClient from '../api/apiClient';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const createOrder = async (orderData) => {
  const { data } = await apiClient.post('/orders', orderData);
  return data;
};

export default function AppOrderCreate() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation(createOrder, {
    onSuccess: (data) => {
      alert(`Pedido #${data.id} criado com sucesso!`);
    },
    onError: (error) => {
      alert(`Erro ao criar pedido: ${error.message} `);
    }
  });

  const onSubmit = (data) => {
    const formattedData = {
      client_id: parseInt(data.clientId, 10),
      items: [
        {
          product_id: 1,
          quantity: 10,
          unit_price: 99.9
        }
      ]
    };
    mutation.mutate(formattedData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow max-w-lg mx-auto transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Criar Novo Pedido
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ID do Cliente
          </label>
          <input
            id="clientId"
            type="number"
            {...register("clientId", { required: true })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white transition-colors"
          />
          {errors.clientId && <span className="text-red-500 text-sm">Este campo é obrigatório.</span>}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            (Itens do pedido seriam adicionados dinamicamente aqui - Demo)
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
          >
            {mutation.isLoading ? 'Salvando...' : 'Salvar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}