/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'var(--font-family-base)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-family-mono)'],
      },
      fontSize: {
        'micro': ['var(--font-size-micro, 0.625rem)', { lineHeight: 'var(--line-height-micro, 0.875rem)', letterSpacing: '0.01em' }],
        'caption': ['var(--font-size-caption, 0.6875rem)', { lineHeight: 'var(--line-height-caption, 1rem)', letterSpacing: '0.005em' }],
        'label': ['var(--font-size-label, 0.8125rem)', { lineHeight: '1.125rem' }],
        'card-title': ['var(--font-size-card-title, 0.9375rem)', { lineHeight: '1.35rem' }],
        'section-title': ['var(--font-size-section-title, 1.125rem)', { lineHeight: '1.5rem' }],
        'page-title': ['var(--font-size-page-title, 1.5rem)', { lineHeight: '2rem' }],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        slate: {
          850: '#151f32',
          950: '#0b1120',
        }
      },
    },
  },
  plugins: [],
}
