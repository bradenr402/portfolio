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
          50: '#fdf2f2',
          100: '#fbe6e4',
          200: '#f7c8c5',
          300: '#f1a39d',
          400: '#e97068',
          500: '#c1281c',
          600: '#ae2319',
          700: '#9c1f17',
          800: '#7d1912',
          900: '#5e130e',
          950: '#350b08',
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
          '0%, 100%': { transform: 'translate(0, -5px)' },
          '50%': { transform: 'translate(0, 10px)' },
        },
      },
      animation: {
        wave: 'wave 2s linear infinite',
        slide: 'slide 1s ease-in-out infinite',
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
