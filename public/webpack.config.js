// webpack.config.js
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js', // Your entry file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // Output file name
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: true, // Enable Hot Module Replacement
    port: 3000,
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
