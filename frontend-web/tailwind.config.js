/** @type {import('tailwindcss').Config} */
module.exports = {
  // Habilita o modo escuro baseado na classe 'dark' na tag HTML/Body
  darkMode: 'class', 
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores da Identidade Visual Repforce
        'repforce-primary': '#0038FF',       // Azul Vibrante
        'repforce-dark': '#000026',        // Azul-marinho profundo
        'repforce-light': '#E4E8f7',       // Azul-claro Acinzentado
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], 
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}