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
          50: '#fde8e7',
          100: '#fbd0ce',
          200: '#f7a19d',
          300: '#f3726c',
          400: '#ef433b',
          500: '#c1281c',
          600: '#9a2017',
          700: '#731812',
          800: '#4c100c',
          900: '#250806',
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
      },
      animation: {
        wave: 'wave 2s linear infinite',
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
