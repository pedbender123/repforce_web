import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient'; 
import sysAdminApiClient from '../api/sysAdminApiClient';
import { useForm } from 'react-hook-form';

export default function GenericListForm({ config }) {
  const { endpoint, title, columns, fields } = config || {};
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  // Decide qual cliente usar baseado na rota
  const client = endpoint?.startsWith('/sysadmin') ? sysAdminApiClient : apiClient;

  const { data: items } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await client.get(endpoint)).data,
    enabled: !!endpoint
  });

  const mutation = useMutation({
    mutationFn: (data) => client.post(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries([endpoint]);
      setIsEditing(false);
      reset();
    }
  });

  if (!endpoint) return <div>Erro: Configuração inválida</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Novo</button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select {...register(field.name)} className="w-full border rounded p-2">
                    {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} {...register(field.name)} className="w-full border rounded p-2" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
             <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
             <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map(col => <th key={col.key} className="p-3 text-left">{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="p-3">
                    {col.type === 'boolean' ? (item[col.key] ? 'Sim' : 'Não') : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}