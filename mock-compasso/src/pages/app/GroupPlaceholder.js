import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Folder, ArrowUp } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';

const GroupPlaceholder = () => {
    const { groupId } = useParams();
    const { isEditMode } = useBuilder();
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const { data } = await apiClient.get('/api/builder/navigation');
                const group = data.find(g => g.id === groupId);
                if (group) setGroupName(group.name);
            } catch (e) {
                console.error(e);
            }
        };
        if (groupId) fetchGroup();
    }, [groupId]);

    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in duration-500">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
                <Folder size={64} className="text-blue-500 opacity-80" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {groupName || "Área Selecionada"}
            </h2>
            
            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-8">
                Selecione uma página no menu superior para começar.
            </p>

            {isEditMode && (
                <div className="flex flex-col items-center animate-bounce">
                    <ArrowUp size={24} className="text-blue-500 mb-2" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Adicione páginas acima
                    </span>
                </div>
            )}
        </div>
    );
};

export default GroupPlaceholder;
