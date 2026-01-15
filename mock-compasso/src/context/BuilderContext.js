import React, { createContext, useState, useContext } from 'react';

export const BuilderContext = createContext();

export const BuilderProvider = ({ children }) => {
    const [isEditMode, setIsEditMode] = useState(false);

    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

    return (
        <BuilderContext.Provider value={{ isEditMode, toggleEditMode }}>
            {children}
        </BuilderContext.Provider>
    );
};

export const useBuilder = () => useContext(BuilderContext);
