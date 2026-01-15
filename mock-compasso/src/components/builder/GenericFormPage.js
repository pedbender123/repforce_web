import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import GenericForm from './GenericForm';

const GenericFormPage = ({ pageId, entityId, layoutConfig }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we are editing an existing record via URL param
    const recordId = searchParams.get('record_id');

    // On success, we want to clear the record_id to return to "New" mode 
    // or maybe redirect? User asked to "Clean the filtered ID".
    // "faca o id filtrado na pagina sair e ficar em branco" -> Reset to Create Mode.
    const handleSuccess = () => {
        // Remove record_id param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('record_id');
        navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recordId ? 'Editar Registro' : 'Novo Registro'}
                </h1>
                <p className="text-gray-500 text-sm">Use este formulário para {recordId ? 'alterar' : 'adicionar'} dados.</p>
            </div>
            
            <GenericForm 
                entityId={entityId} 
                layoutConfig={layoutConfig}
                recordId={recordId} // Pass ID if present
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default GenericFormPage;
