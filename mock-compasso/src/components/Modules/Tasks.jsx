import React, { useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import api from '../../api';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/tasks').then(res => setTasks(res.data));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (!title) return;
        api.post('/tasks', { title }).then(() => {
            setTitle('');
            loadData();
        });
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-white dark:bg-gray-900 animate-fade-in">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Minhas Tarefas</h1>

                {/* Add Input */}
                <form onSubmit={handleAdd} className="flex gap-2 mb-8">
                    <input
                        type="text"
                        className="flex-1 border p-3 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-blue-500"
                        placeholder="Adicionar nova tarefa..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <button className="bg-blue-600 text-white px-6 font-bold rounded-sm hover:bg-blue-700">Adicionar</button>
                </form>

                {/* List */}
                <div className="space-y-2">
                    {tasks.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                            <button className="text-gray-400 hover:text-blue-600">
                                {t.status === 'Concluido' ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5" />}
                            </button>
                            <div className="flex-1">
                                <p className={`font-medium ${t.status === 'Concluido' ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                                    {t.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t.client_name} • {t.deadline}</p>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${t.priority === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {t.priority}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tasks;
