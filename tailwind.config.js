/** @type {import('tailwindcss').Config} */

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
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
