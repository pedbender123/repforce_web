import React, { useEffect, useState } from 'react';
import { mockEngine } from '../api/mockEngine';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

export default function GenericList({ collection, openTab }) {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados (Mock Instantâneo)
  useEffect(() => {
    const list = mockEngine.list(collection);
    setData(list);
  }, [collection]);

  // Filtragem local simples
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Colunas dinâmicas baseadas na primeira linha (simples)
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && !k.endsWith('_Ref')).slice(0, 5) : [];

  const handleEdit = (item) => {
    openTab({
       id: `edit-${collection}-${item.id}`,
       title: `Editar ${collection.slice(0, -1)} ${item.id}`, // remove 's' + id
       type: 'form',
       collection,
       recordId: item.id
    });
  };

  const handleNew = () => {
    openTab({
       id: `new-${collection}-${Date.now()}`,
       title: `Novo ${collection.slice(0, -1)}`,
       type: 'form',
       collection,
       recordId: null
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* TOOLBAR */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
         
         {/* Search */}
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Buscar em ${collection}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
         </div>

         {/* Actions */}
         <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
               <Filter size={16} /> Filtros
            </button>
            <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all">
               <Plus size={18} /> Novo
            </button>
         </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
             <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                {columns.map(col => (
                  <th key={col} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="px-6 py-3 border-b border-gray-200"></th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredData.length === 0 ? (
               <tr>
                 <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum registro encontrado.
                 </td>
               </tr>
             ) : (
               filteredData.map(row => (
                 <tr onClick={() => handleEdit(row)} key={row.id} className="group hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 w-4">
                       <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    {columns.map(col => (
                       <td key={col} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {renderCell(col, row[col])}
                       </td>
                    ))}
                    <td className="px-6 py-4 w-10 text-right">
                       <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit size={16} />
                       </button>
                    </td>
                 </tr>
               ))
             )}
          </tbody>
        </table>
      </div>
      
      {/* FOOTER */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
         <span>Mostrando {filteredData.length} registros</span>
         <div className="flex gap-2">
            <button className="hover:text-gray-900">Anterior</button>
            <button className="hover:text-gray-900">Próxima</button>
         </div>
      </div>
    </div>
  );
}

function renderCell(key, value) {
  if (key.includes('Status')) {
     const colors = {
        'Aprovado': 'bg-emerald-100 text-emerald-800',
        'Normal': 'bg-emerald-100 text-emerald-800',
        'Crítico': 'bg-red-100 text-red-800',
        'Cancelado': 'bg-red-100 text-red-800',
        'Pendente': 'bg-yellow-100 text-yellow-800',
        'Em Negociacao': 'bg-blue-100 text-blue-800',
     };
     const style = colors[value] || 'bg-gray-100 text-gray-800';
     return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>{value}</span>;
  }
  
  if (key.includes('Preco') || key.includes('Valor') || key.includes('Total')) {
     return typeof value === 'number' 
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : value;
  }

  return value;
}
