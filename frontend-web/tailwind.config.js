/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // A 'Termina' e 'Barlow' são fontes customizadas.
        // Usaremos 'Manrope' (pág 63) ou 'Inter' como substituto sans-serif.
        sans: ['Inter', 'sans-serif'], // Usando Inter como fallback moderno
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}