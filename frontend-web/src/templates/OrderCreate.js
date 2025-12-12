// Baseado no seu src/pages/app/AppOrderCreate.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

export default function OrderCreate() {
  const { register, handleSubmit } = useForm();
  
  const mutation = useMutation((data) => apiClient.post('/orders/orders', data), {
    onSuccess: (res) => alert(`Pedido #${res.data.id} criado!`),
    onError: (err) => alert(err.message)
  });

  const onSubmit = (data) => {
    // Mock de payload
    const payload = {
        client_id: parseInt(data.clientId),
        items: [{ product_id: 1, quantity: 1 }] // Mock
    };
    mutation.mutate(payload);
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white dark:bg-gray-800 rounded shadow m-6">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Novo Pedido</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm dark:text-white">ID Cliente</label>
                <input type="number" {...register("clientId")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-center text-sm dark:text-gray-300">
                Seleção de produtos (Demo Simplificada)
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Salvar Pedido</button>
        </form>
    </div>
  );
}