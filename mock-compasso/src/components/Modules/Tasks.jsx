import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import { CheckCircle2, Circle } from 'lucide-react';

const TaskForm = ({ onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título da Tarefa</label>
                <input
                    type="text"
                    autoFocus
                    className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSubmit({ title })}
                />
            </div>
            <div className="flex justify-end pt-2 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button onClick={() => onSubmit({ title })} className="bg-blue-600 text-white px-4 py-2 rounded-sm text-sm font-bold shadow-lg uppercase tracking-tighter">Salvar Tarefa</button>
            </div>
        </div>
    );
};

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState('list');

    // Mock tabstate for StandardModule
    const tabState = { tabs: [], activeId, setActiveId, open: () => { }, close: () => { } };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/tasks').then(res => setTasks(res.data));
    };

    const handleAdd = (data) => {
        api.post('/tasks', data).then(() => loadData());
    };

    const handleDelete = (id) => {
        api.delete(`/tasks/${id}`).then(() => loadData());
    };

    const toggleStatus = (t) => {
        const newStatus = t.status === 'Concluída' ? 'Pendente' : 'Concluída';
        api.put(`/tasks/${t.id}`, { status: newStatus }).then(() => loadData());
    };

    const renderRow = (t) => (
        <>
            <td className="p-3 w-10">
                <button onClick={(e) => { e.stopPropagation(); toggleStatus(t); }} className="focus:outline-none transition-transform active:scale-90">
                    {t.status === 'Concluída' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                </button>
            </td>
            <td className={`p-3 font-medium ${t.status === 'Concluída' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                {t.title}
            </td>
            <td className="p-3 text-right">
                <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{t.status}</span>
            </td>
        </>
    );

    return (
        <StandardModule
            title="Tarefas"
            data={tasks}
            newItemLabel="Nova Tarefa"
            columns={['Status', 'Título', 'Situação']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={() => null}
            onAdd={handleAdd}
            onDelete={handleDelete}
            renderForm={TaskForm}
        />
    );
};

export default Tasks;
