var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './app/main.js',
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: './bundle.js'
  }
};
