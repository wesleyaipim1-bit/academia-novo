/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0b0b0f',
          panel: '#121319',
          accent: '#d92d2d',
          accentSoft: '#f87171',
          muted: '#a1a1aa',
          line: '#2a2d36',
        },
      },
      boxShadow: {
        glow: '0 20px 45px rgba(217,45,45,0.18)',
      },
    },
  },
  plugins: [],
}
