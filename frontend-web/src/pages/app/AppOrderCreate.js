import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

// Função para postar o pedido
const createOrder = async (orderData) => {
  // Corrigido para /api/orders (como definido no main.py)
  const { data } = await apiClient.post('/api/orders', orderData); 
  return data;
};

export default function AppOrderCreate() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const mutation = useMutation(createOrder, {
    onSuccess: (data) => {
      // Sucesso!
      alert(`Pedido #${data.id} criado com sucesso!`);
      // TODO: Redirecionar ou limpar o formulário
    },
    onError: (error) => {
      // Erro!
      alert(`Erro ao criar pedido: ${error.message}`);
    }
  });

  // (WF III.2)
  // Este é um formulário complexo.
  // Vamos fazer um placeholder muito simples.
  const onSubmit = (data) => {
    // A API espera uma lista de 'items'
    // O formulário real teria um 'field array'
    const formattedData = {
      client_id: parseInt(data.clientId, 10),
      items: [
        {
          product_id: 1, // Exemplo
          quantity: 10,
          unit_price: 99.9
        }
      ]
    };
    // A API de pedidos espera o nome do endpoint como /orders
    // O seu arquivo de backend é 'pedidos.py', mas no 'main.py' 
    // o prefixo do router é '/api/orders'
    mutation.mutate(formattedData);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Criar Novo Pedido (Simplificado)
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
            ID do Cliente
          </label>
          <input
            id="clientId"
            type="number"
            {...register("clientId", { required: true })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
          />
          {errors.clientId && <span className="text-red-500 text-sm">Este campo é obrigatório.</span>}
        </div>
        
        {/* Aqui entraria o Field Array para 'items' */}
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600">
            (Itens do pedido seriam adicionados dinamicamente aqui)
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400"
          >
            {mutation.isLoading ? 'Salvando...' : 'Salvar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}