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
        // Cores da Identidade Visual PBPM
        'repforce-primary': '#8B5CF6',       // Roxo (Violet 500)
        'repforce-dark': '#4C1D95',        // Indigo (Violet 900)
        'repforce-light': '#020617',       // Navy (Slate 950 - Fundo)
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