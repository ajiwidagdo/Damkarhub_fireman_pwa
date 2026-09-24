// Konfigurasi Tailwind: dark mode via class, warna kustom, dan palet abu HANGAT (tema api)
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        damkar: '#dc2626', rescue: '#f59e0b', sos: '#10b981',
        gray: {
          50: '#faf7f6', 100: '#f4eeed', 200: '#e8dfde', 300: '#d4c7c6', 400: '#a89b9b',
          500: '#7a6c6d', 600: '#574849', 700: '#3a2b2d', 800: '#251719', 900: '#170d0f', 950: '#0d0708'
        }
      }
    }
  }
};
