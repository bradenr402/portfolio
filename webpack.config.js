const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
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
    open: true,
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
    new HtmlWebpackPlugin({
      template: './src/components/footer.html',
      filename: 'components/footer.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/components/nav.html',
      filename: 'components/nav.html',
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
        type: 'asset/source',
      },
    ],
  },
};
