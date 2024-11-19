/* eslint-disable import/no-extraneous-dependencies */
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    'postcss-preset-env',
    tailwindcss,
    autoprefixer,
  ],
};
