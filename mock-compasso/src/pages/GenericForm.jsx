import React, { useEffect, useState } from 'react';
import { mockEngine } from '../api/mockEngine';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';

export default function GenericForm({ collection, id, onClose }) {
  const [formData, setFormData] = useState({});
  const [schema, setSchema] = useState([]);
  
  // Combos (Selects de Referência)
  const [combos, setCombos] = useState({});

  useEffect(() => {
    // 1. Carregar Schema
    const fields = mockEngine.getSchema(collection);
    setSchema(fields);

    // 2. Carregar Dados de Selects (ex: Clientes para Pedido)
    fields.forEach(field => {
       if (field.type === 'select' && field.source) {
          const list = mockEngine.list(field.source);
          setCombos(prev => ({ ...prev, [field.name]: list }));
       }
    });

    // 3. Carregar Registro (Se for Edição)
    if (id) {
       const record = mockEngine.getById(collection, id);
       if (record) setFormData(record);
    } else {
       // Defaults para criação
       setFormData({});
    }

  }, [collection, id]);

  const handleChange = (e) => {
     const { name, value, type } = e.target;
     let finalValue = value;
     
     if (type === 'number' || type === 'select-one') {
        // Tentar converter número se não for select
        if (type === 'number') finalValue = Number(value);
     }
     
     setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id) {
       mockEngine.update(collection, id, formData);
       alert('Registro atualizado com sucesso!');
    } else {
       const newItem = mockEngine.create(collection, formData);
       alert(`Registro criado! ID: ${newItem.id}`);
       onClose(); // Fecha para voltar pra lista
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm rounded-lg border border-gray-200 mt-6">
       
       <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
             </button>
             <h2 className="text-xl font-bold text-gray-800">
                {id ? `Editar ${collection} #${id}` : `Novo ${collection}`}
             </h2>
          </div>
          <button 
             onClick={handleSubmit}
             className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all"
          >
             <Save size={18} /> Salvar
          </button>
       </div>

       <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schema.map(field => (
             <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">
                   {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {/* SELECT */}
                {field.type === 'select' && (
                   <select 
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      <option value="">Selecione...</option>
                      
                      {/* Opções Hardcoded */}
                      {field.options && field.options.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                      ))}

                      {/* Opções Dinâmicas (Referência) */}
                      {field.source && combos[field.name] && combos[field.name].map(item => (
                         <option key={item.id} value={item.id}>
                            {item[field.displayKey] || item.name || item.id}
                         </option>
                      ))}
                   </select>
                )}

                {/* INPUT TEXT/NUMBER/DATE/CURRENCY */}
                {['text', 'number', 'date', 'currency', 'url'].includes(field.type) && (
                   <input 
                      type={field.type === 'currency' ? 'number' : field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      step={field.type === 'currency' ? "0.01" : "1"}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                )}
             </div>
          ))}

          {schema.length === 0 && (
             <div className="col-span-2 text-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                ⚠️ Nenhum campo definido no Schema para "{collection}".<br/>
                <span className="text-xs">Editar mockEngine.js a função getSchema()</span>
             </div>
          )}
       </form>

    </div>
  );
}
