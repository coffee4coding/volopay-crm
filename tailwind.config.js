/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F172A',
        accent: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgb(99 102 241 / 0.35)' },
          '50%': { borderColor: 'rgb(99 102 241 / 0.9)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.2s ease-out',
        'modal-in': 'modal-in 0.15s ease-out',
        'pulse-border': 'pulse-border 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
