/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#080d1a',
        },
        market: {
          buy: '#10b981',      // Emerald green
          buyLight: '#34d399',
          buyBg: 'rgba(16, 185, 129, 0.12)',
          sell: '#f43f5e',     // Rose red
          sellLight: '#fb7185',
          sellBg: 'rgba(244, 63, 94, 0.12)',
          accent: '#6366f1',   // Indigo
          gold: '#f59e0b',     // Amber
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
