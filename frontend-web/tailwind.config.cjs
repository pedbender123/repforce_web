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
        'repforce-primary': '#2563eb',       // Royal Blue (Blue 600)
        'repforce-dark': '#1e3a8a',        // Dark Blue (Blue 900)
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