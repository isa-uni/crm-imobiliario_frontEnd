/** @type {import('tailwindcss').Config} */

// Cor semântica ligada a uma variável de tema (app/globals.css).
// O <alpha-value> mantém modificadores como bg-brand/10 funcionando.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paletas brutas da marca — não mudam com o tema.
        // Nas telas, prefira os tokens semânticos abaixo.
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

        // Tokens semânticos (mudam entre claro e escuro)
        surface: token('surface'),
        card: token('card'),
        subtle: token('subtle'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        placeholder: token('placeholder'),
        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          fg: token('brand-fg'),
          soft: token('brand-soft'),
        },
        'on-brand': token('on-brand'),
        focus: token('focus'),
        sidebar: {
          DEFAULT: token('sidebar'),
          fg: token('sidebar-fg'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          soft: token('accent-soft'),
        },
        'on-accent': token('on-accent'),
        success: { DEFAULT: token('success'), bg: token('success-bg'), border: token('success-border') },
        warning: { DEFAULT: token('warning'), bg: token('warning-bg'), border: token('warning-border') },
        danger: { DEFAULT: token('danger'), bg: token('danger-bg'), border: token('danger-border') },
        info: { DEFAULT: token('info'), bg: token('info-bg'), border: token('info-border') },
        overlay: token('overlay'),
        chart: {
          1: token('chart-1'),
          2: token('chart-2'),
          3: token('chart-3'),
          4: token('chart-4'),
          5: token('chart-5'),
          6: token('chart-6'),
          7: token('chart-7'),
        },
        'on-chart': token('on-chart'),
        cat: {
          indigo: token('cat-indigo'),
          orange: token('cat-orange'),
          purple: token('cat-purple'),
          teal: token('cat-teal'),
          green: token('cat-green'),
        },
      },
      borderRadius: {
        card: '14px',
        btn: '10px',
        sm2: '9px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-lg': 'var(--shadow-card-lg)',
        btn: 'var(--shadow-btn)',
      },
    },
  },
  plugins: [],
}
