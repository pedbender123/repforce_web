import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
      title={theme === 'light' ? "Mudar para modo escuro" : "Mudar para modo claro"}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-6 h-6 text-gray-700" /> // Lua para modo claro
      ) : (
        <SunIcon className="w-6 h-6 text-yellow-400" /> // Sol para modo escuro
      )}
    </button>
  );
}