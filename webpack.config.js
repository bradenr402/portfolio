const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
  },
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 8080,
    open: false,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      favicon: './src/images/BR_logo.svg',
    }),
    new HtmlWebpackPlugin({
      template: './src/projects.html',
      filename: 'projects.html',
      favicon: './src/images/BR_logo.svg',
    }),
    new HtmlWebpackPlugin({
      template: './src/skills.html',
      filename: 'skills.html',
      favicon: './src/images/BR_logo.svg',
    }),
    new HtmlWebpackPlugin({
      template: './src/contact.html',
      filename: 'contact.html',
      favicon: './src/images/BR_logo.svg',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, 'src'),
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
};
