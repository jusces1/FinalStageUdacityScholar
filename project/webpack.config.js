const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); //installed via npm
const webpack = require('webpack'); //to access built-in plugins

module.exports = {
    mode: 'development',
    entry: [
        './src/main.js',
        './src/dbhelper_restaurants.js',
        './src/dbhelper_reviews.js',
        './src/restaurant_info.js',
        './src/reviews.js',
    ], 
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};