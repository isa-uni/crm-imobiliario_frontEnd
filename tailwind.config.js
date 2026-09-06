/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f2740',
          50: '#eef4fa',
          100: '#dbe8f4',
          200: '#b8d0e6',
          300: '#8fb5d3',
          400: '#5f8fb5',
          500: '#27506f',
          600: '#1d3f5c',
          700: '#16354f',
          800: '#122c42',
          900: '#0f2740',
        },
        accent: {
          DEFAULT: '#f2a900',
          dark: '#c98a00',
          50: '#fffaf0',
          100: '#fdefd2',
          200: '#f9dd9f',
          300: '#f6c860',
          400: '#f4b631',
          500: '#f2a900',
          600: '#d19200',
          700: '#c98a00',
          800: '#a06d00',
          900: '#7a5300',
        },
        surface: '#f2f5f9',
        line: '#e1e8f0',
        ink: '#12212f',
      },
      borderRadius: {
        card: '14px',
        btn: '10px',
        sm2: '9px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,38,60,.06), 0 4px 14px rgba(16,38,60,.07)',
        'card-lg': '0 8px 30px rgba(16,38,60,.14)',
        btn: '0 1px 2px rgba(16,38,60,.10)',
      },
    },
  },
  plugins: [],
}
