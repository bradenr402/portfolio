/** @type {import('tailwindcss').Config} */

const fluidType = require('tailwindcss-fluid-type');

module.exports = {
  darkMode: 'class',
  mode: 'jit',
  content: ['./dist/*.html', './src/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Calibre', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fde8e8',
          100: '#f9c7c7',
          200: '#f39999',
          300: '#ec6b6b',
          400: '#e43d3d',
          500: '#d30002',
          600: '#b80002',
          700: '#9e0002',
          800: '#7c0002',
          900: '#5a0001',
          950: '#330000',
        },
      },
      keyframes: {
        wave: {
          '0%': { transform: 'rotate(0.0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10.0deg)' },
          '60%': { transform: 'rotate(0.0deg)' },
          '100%': { transform: 'rotate(0.0deg)' },
        },
        slide: {
          '0%, 100%': { transform: 'translate(0, -2px)' },
          '50%': { transform: 'translate(0, 8px)' },
        },
      },
      animation: {
        wave: 'wave 2s linear infinite',
        slide: 'slide 1.2s ease-in-out infinite',
      },
    },
  },
  variants: {
    extend: {},
  },
  corePlugins: {
    fontSize: false,
  },
  plugins: [fluidType],
};
