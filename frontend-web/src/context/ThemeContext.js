import React, { createContext, useState, useEffect, useContext } from 'react';

// Exportação NOMEADA essencial para corrigir o erro do build
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Verifica se já existe preferência salva ou usa 'light' como padrão
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove a classe antiga e adiciona a nova (dark/light) no elemento HTML
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);

    // Salva a preferência
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado opcional para facilitar o uso
export const useAuth = () => {
    const context = useContext(AuthContext);
    // ... validação ...
    return context;
};