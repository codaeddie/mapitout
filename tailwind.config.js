/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'node-orange': '#f97316',
        'node-blue': '#3b82f6', 
        'node-red': '#ef4444',
        'node-green': '#10b981',
        'node-purple': '#8b5cf6',
        'node-amber': '#f59e0b',
      },
      backgroundImage: {
        'circuit-pattern': "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\"><defs><pattern id=\"grid\" width=\"60\" height=\"60\" patternUnits=\"userSpaceOnUse\"><path d=\"M 60 0 L 0 0 0 60\" fill=\"none\" stroke=\"#111827\" stroke-width=\"1\"/></pattern></defs><rect width=\"100%\" height=\"100%\" fill=\"url(#grid)\"/></svg>')",
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 