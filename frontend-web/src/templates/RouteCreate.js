import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { MapPinIcon } from '@heroicons/react/24/solid';

export default function RouteCreate() {
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);

  const { data: clients } = useQuery(['clientsList'], async () => {
    const res = await apiClient.get('/crm/clients');
    return res.data;
  });

  const createRouteMutation = useMutation((data) => apiClient.post('/routes/routes', data), {
    onSuccess: () => alert('Rota salva com sucesso!')
  });

  const toggleClient = (client) => {
    if (selectedClients.find(c => c.id === client.id)) {
        setSelectedClients(selectedClients.filter(c => c.id !== client.id));
    } else {
        setSelectedClients([...selectedClients, client]);
    }
  };

  const generateMapsLink = () => {
    if (selectedClients.length === 0) return;
    const baseUrl = "https://www.google.com/maps/dir/?api=1&origin=Current+Location";
    const dest = selectedClients[selectedClients.length - 1];
    const waypoints = selectedClients.slice(0, -1);
    
    // Fallback se não tiver lat/lon real
    const getLoc = (c) => `${c.name}, ${c.address_json?.cidade || ''}`;
    
    let url = `${baseUrl}&destination=${getLoc(dest)}`;
    if (waypoints.length > 0) {
        url += `&waypoints=${waypoints.map(getLoc).join('|')}`;
    }
    window.open(url, '_blank');
  };

  const handleSave = () => {
    if (!routeName || !routeDate || selectedClients.length === 0) return alert("Preencha tudo!");
    createRouteMutation.mutate({
        name: routeName,
        date: routeDate,
        stops: selectedClients.map((c, i) => ({ client_id: c.id, sequence: i + 1 }))
    });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nova Rota de Visita</h1>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
            type="text" placeholder="Nome da Rota (Ex: Zona Norte)" 
            value={routeName} onChange={e => setRouteName(e.target.value)}
            className="rounded border-gray-300 dark:bg-gray-700 dark:text-white p-2"
        />
        <input 
            type="date" 
            value={routeDate} onChange={e => setRouteDate(e.target.value)}
            className="rounded border-gray-300 dark:bg-gray-700 dark:text-white p-2"
        />
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-[400px]">
        {/* Lista Seleção */}
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 font-semibold dark:text-white">Clientes Disponíveis</div>
            <div className="flex-1 overflow-y-auto p-2">
                {clients?.map(client => (
                    <div key={client.id} onClick={() => toggleClient(client)} 
                        className={`cursor-pointer p-3 mb-2 rounded border transition-colors ${
                            selectedClients.find(c => c.id === client.id) 
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30' 
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <div className="font-medium text-gray-900 dark:text-white">{client.trade_name || client.name}</div>
                        <div className="text-xs text-gray-500">{client.address_json?.cidade || 'Sem cidade'}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Lista Ordenada */}
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 font-semibold dark:text-white">Sequência de Visita</div>
            <div className="flex-1 overflow-y-auto p-2">
                {selectedClients.map((client, idx) => (
                    <div key={client.id} className="flex items-center p-3 mb-2 bg-gray-50 dark:bg-gray-700 rounded relative">
                        <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 font-bold">
                            {idx + 1}
                        </div>
                        <span className="text-sm dark:text-white truncate">{client.trade_name || client.name}</span>
                    </div>
                ))}
                {selectedClients.length === 0 && <div className="text-gray-400 text-center mt-10">Selecione clientes ao lado</div>}
            </div>
            <div className="p-4 border-t dark:border-gray-700 grid grid-cols-2 gap-2">
                <button onClick={handleSave} className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Salvar</button>
                <button onClick={generateMapsLink} className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                    <MapPinIcon className="w-4 h-4"/> Maps
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}