/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rex: {
          bg: '#0f1117',
          panel: '#171a23',
          line: 'rgba(255,255,255,0.1)',
          muted: '#94a3b8',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(34,197,94,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'soft-pulse': 'softPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { opacity: 0.75, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
