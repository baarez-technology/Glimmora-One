import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem' },
    extend: {
      colors: {
        // Calm warm-neutral palette — "glimmer + aurora" on ink/cream.
        ink: {
          50: '#f9f6f1',
          100: '#efe9df',
          200: '#ddd2c1',
          300: '#bfae93',
          400: '#9a8770',
          500: '#766451',
          600: '#574a3c',
          700: '#3d342b',
          800: '#27211c',
          900: '#16120f',
          950: '#0c0a08',
        },
        glimmer: {
          50: '#fdf8ec',
          100: '#fbedc9',
          200: '#f6d98e',
          300: '#f0c057',
          400: '#e9a932',  // primary accent
          500: '#d18819',
          600: '#a96513',
          700: '#7d4912',
          800: '#5a3613',
          900: '#3a2610',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 16, 12, 0.04), 0 8px 24px -8px rgba(20, 16, 12, 0.08)',
        glow: '0 0 0 1px rgba(233, 169, 50, 0.25), 0 18px 40px -16px rgba(233, 169, 50, 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        breathe: 'breathe 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
